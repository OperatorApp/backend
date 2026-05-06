const OPENAI_URL = "https://api.openai.com/v1/chat/completions"
const query = require("../models/queries")
const {getLanguagesSer} = require("./operatorService")

const generateReply = async (systemPrompt, chatHistory) => {
    const messages = [
        { role: "system", content: systemPrompt },
        ...chatHistory,
        { role: "user", content: "Generate your next reply as the customer. Be realistic, sometimes make your statements ambiguous. Reply with ONLY the chat message, nothing else." }
    ]

    const response = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages
        })
    })
    console.log("OpenAI API response status:", response.status)
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || "OpenAI API request failed")
    }

    const data = await response.json()
    return data.choices[0].message.content
}


const translateAndDetect = async (text, targetLang) => {
    const response = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: `You are a translator. Translate the following text to ${targetLang}. Respond ONLY in JSON format: {"translation": "...", "detected_lang": "..."}. No other text.` },
                { role: "user", content: text }
            ]
        })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || "OpenAI API request failed")
    }

    const data = await response.json()
    const raw = data.choices[0].message.content
    const clean = raw.replace(/```json|```/g, "").trim()
    return JSON.parse(clean)
}


const askKnowledgeBase = async (operatorId, prompt) => {
    const vectorInfo = await query.getOperatorVectorInfo(operatorId)
    const operatorLang = await getLanguagesSer(operatorId)

    if (!vectorInfo?.vector_store_id) {
        throw new Error("No knowledge base configured for this operator")
    }

    const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            input: prompt,
            tools: [{
                type: "file_search",
                vector_store_ids: [vectorInfo.vector_store_id]
            }],
            instructions: `You are a customer support assistant. Answer using ONLY the provided knowledge base. If the answer is not in the knowledge base, say so clearly. Be concise and factual. Do not make up product names, links, or information respond in ${operatorLang}.`
        })
    })

    if (!res.ok) {
        const err = await res.json()
        throw new Error(`Knowledge query failed: ${err.error?.message}`)
    }

    const data = await res.json()
    const text = data.output
        .filter(item => item.type === "message")
        .map(item => item.content.map(c => c.text).join(""))
        .join("")

    return text
}


const createPromptButtonSer = async (operatorId, name, prompt) => {
    try {
        return await query.postButton(operatorId, name, prompt)
    } catch (err) {
        throw new Error(`Failed to create prompt button: ${err.message}`)
    }
}

const getPromptButtonsSer = async (operatorId) => {
    try {
        return await query.getButtonsByOperatorId(operatorId)
    } catch (err) {
        throw new Error(`Failed to get prompt buttons: ${err.message}`)
    }
}

const upsertPromptButtonSer = async (operatorId, name, prompt) => {
    try {
        return await query.upsertPromptButton(operatorId, name, prompt)
    } catch (err) {
        throw new Error(`Failed to upsert prompt button: ${err.message}`)
    }
}

const deletePromptButtonSer = async (operatorId, buttonId) => {
    try {
        const result = await query.deletePromptButton(operatorId, buttonId)
        if (result.count === 0) {
            throw new Error("Button not found or unauthorized")
        }
        return result
    } catch (err) {
        throw new Error(`Failed to delete prompt button: ${err.message}`)
    }
}

const askPromptButton = async (operatorId, buttonId, threadId) => {
    const button = await query.getPromptButtonById(operatorId, buttonId)

    if (!button) throw new Error("Prompt button not found")
    console.log("operatorId:", operatorId, "buttonId:", buttonId, "threadId:", threadId)
    const vectorInfo = await query.getOperatorVectorInfo(operatorId)
    if (!vectorInfo?.vector_store_id) throw new Error("No knowledge base configured")

    const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            input: button.prompt,
            tools: [{
                type: "file_search",
                vector_store_ids: [vectorInfo.vector_store_id]
            }],
            instructions: "You are a customer support assistant. Answer using ONLY the provided knowledge base. If the answer is not in the knowledge base, say so clearly. Be concise and factual. only respond with plain text, no markdown or formatting. Do not make up product names, links, or information. This response will be sent directly to the customer in the chat thread, so make sure it's clear and helpful."
        })
    })

    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || "OpenAI request failed")
    }

    const data = await res.json()
    const message = data.output.find(o => o.type === "message")
    const text = message?.content
        .filter(c => c.type === "output_text")
        .map(c => c.text)
        .join("")

    console.log("Prompt button response:", data)
    console.log("content array:", JSON.stringify(message?.content, null, 2))
    return { response: text, thread_id: data.id }
}


const scoreSectionsSemantically = async (messageText, catalog, snapshot) => {
    const sections = catalog.map(s => ({ id: s.id, description: s.description }))

    const hint = summarizeSnapshotForAi(snapshot)

    const systemPrompt = `You score how relevant a customer's chat message is to different context sections about them. For each section, output a relevance score from 0.0 to 1.0:
- 0.0 = irrelevant
- 0.3 = vaguely related
- 0.6 = clearly related
- 1.0 = directly about this section
Be strict. Most messages are about 1-2 sections, not all of them. Respond with JSON only.`

    const userPrompt = `Sections:
${sections.map(s => `- ${s.id}: ${s.description}`).join("\n")}

Customer context (for grounding, not for scoring):
${hint}

Message: ${JSON.stringify(messageText)}

Respond with: {"scores": {"customer": 0.0, "session": 0.0, "url_trail": 0.0, "cart": 0.0, "orders": 0.0, "sentiment": 0.0}}`

    const response = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0.1,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
        }),
    })

    if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error?.message || "AI scoring request failed")
    }

    const data = await response.json()
    const parsed = JSON.parse(data.choices[0].message.content)
    return parsed.scores ?? {}
}

function summarizeSnapshotForAi(snapshot) {
    if (!snapshot) return "(no context available)"
    const parts = []
    if (snapshot.customer?.name)              parts.push(`name=${snapshot.customer.name}`)
    if (snapshot.country || snapshot.city)    parts.push(`location=${[snapshot.city, snapshot.country].filter(Boolean).join(", ")}`)
    if (snapshot.cart_snapshot?.items?.length) parts.push(`cart_items=${snapshot.cart_snapshot.items.length}`)
    if (snapshot.orders?.length)              parts.push(`past_orders=${snapshot.orders.length}`)
    if (snapshot.url_trail?.length)           parts.push(`pages_browsed=${snapshot.url_trail.length}`)
    return parts.length ? parts.join("; ") : "(empty snapshot)"
}


module.exports = {
    generateReply,
    translateAndDetect,
    askKnowledgeBase,
    createPromptButtonSer,
    getPromptButtonsSer,
    upsertPromptButtonSer,
    deletePromptButtonSer,
    askPromptButton,
    scoreSectionsSemantically,
}


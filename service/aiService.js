const OPENAI_URL = "https://api.openai.com/v1/chat/completions"
const query = require("../models/queries")

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
            instructions: "You are a customer support assistant. Answer using ONLY the provided knowledge base. If the answer is not in the knowledge base, say so clearly. Be concise and factual. Do not make up product names, links, or information."
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


module.exports = { generateReply,translateAndDetect, askKnowledgeBase }


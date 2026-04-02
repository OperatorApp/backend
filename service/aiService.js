const OPENAI_URL = "https://api.openai.com/v1/chat/completions"

const generateReply = async (systemPrompt, chatHistory) => {
    const messages = [
        { role: "system", content: systemPrompt },
        ...chatHistory,
        { role: "user", content: "Generate your next reply as the customer. Reply with ONLY the chat message, nothing else." }
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

module.exports = { generateReply,translateAndDetect }


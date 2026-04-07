const aiService = require('../service/aiService')
const knowledgeService = require('../service/knowledgeService')

const customerSimulation = async (req, res) => {
    const { systemPrompt, chatHistory } = req.body

    try {
        const reply = await aiService.generateReply(systemPrompt, chatHistory)
        res.json({ success: true, reply })
    } catch (err) {
        console.error("AI generation error:", err)
        res.status(500).json({ success: false, error: err.message })
    }
}

const upsertKnowledge = async (req, res) => {
    const operatorId = req.operator.id
    const { content } = req.body

    if (!content) {
        return res.status(400).json({ success: false, error: "content is required" })
    }

    try {
        const entry = await knowledgeService.upsertKnowledge(operatorId, content)
        res.json({ success: true, data: entry })
    } catch (err) {
        console.error("Knowledge upsert error:", err)
        res.status(500).json({ success: false, error: err.message })
    }
}

const queryKnowledge = async (req, res) => {
    const operatorId = req.operator.id
    const { prompt} = req.body

    if (!prompt) {
        return res.status(400).json({ success: false, error: "prompt is required" })
    }

    try {
        const response = await aiService.askKnowledgeBase(operatorId, prompt)
        res.json({ success: true, response })
    } catch (err) {
        console.error("Knowledge query error:", err)
        res.status(500).json({ success: false, error: err.message })
    }
}

module.exports = { customerSimulation, upsertKnowledge, queryKnowledge }
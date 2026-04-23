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
    const operatorId = req.operatorId
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
    const operatorId = req.operatorId
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

const createPromptButton = async (req, res) => {
    const operatorId = req.operatorId
    const { name, prompt } = req.body

    if (!name || !prompt) {
        return res.status(400).json({ success: false, error: "prompt and name is required" })
    }

    try {
        const response = await aiService.createPromptButtonSer(operatorId, name, prompt)
        res.json({ success: true, data: response })
    } catch (err) {
        console.error("Create Button error:", err)
        res.status(500).json({ success: false, error: err.message })
    }
}

const getPromptButtons = async (req, res) => {
    const operatorId = req.operatorId

    try {
        const buttons = await aiService.getPromptButtonsSer(operatorId)
        res.json({ success: true, data: buttons })
    } catch (err) {
        console.error("Get Buttons error:", err)
        res.status(500).json({ success: false, error: err.message })
    }
}

const upsertPromptButton = async (req, res) => {
    const operatorId = req.operatorId
    const { name, prompt } = req.body

    if (!name || !prompt) {
        return res.status(400).json({ success: false, error: "name and prompt are required" })
    }

    try {
        const response = await aiService.upsertPromptButtonSer(operatorId, name, prompt)
        res.json({ success: true, data: response })
    } catch (err) {
        console.error("Upsert Button error:", err)
        res.status(500).json({ success: false, error: err.message })
    }
}

const deletePromptButton = async (req, res) => {
    const operatorId = req.operatorId
    const { buttonId } = req.params

    if (!buttonId) {
        return res.status(400).json({ success: false, error: "buttonId is required" })
    }

    try {
        await aiService.deletePromptButtonSer(operatorId, parseInt(buttonId))
        res.json({ success: true, message: "Button deleted successfully" })
    } catch (err) {
        console.error("Delete Button error:", err)
        res.status(500).json({ success: false, error: err.message })
    }
}

const firePromptButton = async (req, res) => {
    const operatorId = req.operatorId
    const { buttonId, threadId } = req.body
    if (!buttonId) return res.status(400).json({ success: false, error: "buttonId is required" })

    try {
        const result = await aiService.askPromptButton(operatorId, buttonId, threadId)
        res.json({ success: true, ...result })
    } catch (err) {
        console.error("Fire prompt button error:", err)
        res.status(500).json({ success: false, error: err.message })
    }
}


module.exports = {
    customerSimulation,
    upsertKnowledge,
    queryKnowledge,
    createPromptButton,
    getPromptButtons,
    upsertPromptButton,
    deletePromptButton,
    firePromptButton
}
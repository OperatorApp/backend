const aiService = require('../service/aiService')

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

module.exports = { customerSimulation }
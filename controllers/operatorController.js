const { updateLanguageSer, getLanguagesSer } = require("../service/operatorService")


const updateLanguage = async (req, res) => {
    try {
        const operatorId = req.operatorId
        const { languages } = req.body
        await updateLanguageSer(operatorId, languages)
        res.json({ success: true, data: {} })
    } catch (err) {
        console.error("Operator service experienced an error", err)
        res.status(500).json({ success: false, error: "Failed to update languages" })
    }
}

const getLanguages = async (req, res) => {
    try {
        const operatorId = req.operatorId
        const languages = await getLanguagesSer(operatorId)
        res.json({ success: true, data: languages })
    } catch (err) {
        console.error("Operator service experienced an error", err)
        res.status(500).json({ success: false, error: "Failed to fetch languages" })
    }
}


module.exports = { updateLanguage, getLanguages }
const query = require("../models/queries")


const saveMessageSer = async (message) => {
    const { threadId, text, sender, operatorId = null, langDetected = null } = message

    const saved = await query.createMessage(threadId, text, sender, operatorId, langDetected)
    await query.updateThreadLastMessage(threadId)
    return saved
}




module.exports = {
    saveMessageSer
}

























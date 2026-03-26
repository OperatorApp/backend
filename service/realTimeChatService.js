const query = require("../models/queries")


const saveMessageSer = async (message) => {
    const { thread_id, text, sender, operator_id = null, lang_detected = null } = message
    if (!sender) {
        throw new Error("Sender is required")
    }
    const senderType = sender.toUpperCase()

    const validSenderTypes = ['OPERATOR', 'CUSTOMER', 'SYSTEM']
    if (!validSenderTypes.includes(senderType)) {
        throw new Error(`Invalid sender type: ${senderType}. Must be one of: ${validSenderTypes.join(', ')}`)
    }
    const saved = await query.createMessage(thread_id, text, senderType, operator_id, lang_detected)
    await query.updateThreadLastMessage(thread_id)

    return saved
}




module.exports = {
    saveMessageSer
}

























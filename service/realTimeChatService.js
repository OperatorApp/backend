const query = require("../models/queries")
const { translateAndDetect } = require("./aiService")
const {getCurrentOperatorLanguage} = require("./operatorService")

const saveMessageSer = async (message) => {
    const { thread_id, text, sender, snapshot = null, operator_id = null } = message
    if (!sender) {
        throw new Error("Sender is required")
    }
    const senderType = sender.toUpperCase()

    const validSenderTypes = ['OPERATOR', 'CUSTOMER', 'SYSTEM']
    if (!validSenderTypes.includes(senderType)) {
        throw new Error(`Invalid sender type: ${senderType}. Must be one of: ${validSenderTypes.join(', ')}`)
    }

    let translatedText = ""
    let detectedLang = null

    try {
        if (senderType === "CUSTOMER") {
            const result = await translateAndDetect(text, getCurrentOperatorLanguage(operator_id))
            translatedText = result.translation
            detectedLang = result.detected_lang
        } else if (senderType === "OPERATOR") {
            const customerLang = await query.getLastCustomerLang(thread_id)
            console.log("Customer lang for thread", thread_id, ":", customerLang)
            if (customerLang) {
                const result = await translateAndDetect(text, customerLang)
                console.log("Translation result:", result)
                translatedText = result.translation
                detectedLang = result.detected_lang
            } else {
                console.log("No customer language found, skipping translation")
            }
        }
    } catch (err) {
        console.error("Translation failed, saving without translation:", err)
    }

    const saved = await query.createMessage(thread_id, text, senderType, operator_id, detectedLang, translatedText)
    await query.updateThreadLastMessage(thread_id)

    let snapshotChanged = false
    console.log("this is snapshot", snapshot)
    if (snapshot) {
        snapshotChanged = await saveSnapshotSer(thread_id, snapshot)
    }

    return { ...saved, thread_id, snapshot, snapshotChanged }
}
const saveSnapshotSer = async (thread_id, snapshot) => {
    const existing = await query.getSnapshotByThreadId(thread_id)

    const hasChanges = !existing ||
        existing.country !== snapshot.country ||
        existing.city !== snapshot.city ||
        JSON.stringify(existing.url_trail) !== JSON.stringify(snapshot.url_trail) ||
        JSON.stringify(existing.cart_snapshot) !== JSON.stringify(snapshot.cart_snapshot) ||
        existing.sentiment_label !== snapshot.sentiment_label ||
        existing.sentiment_conf !== snapshot.sentiment_conf

    if (hasChanges) {
        await query.upsertSnapshot(thread_id, snapshot)
    }

    return hasChanges
}



module.exports = {
    saveMessageSer
}

























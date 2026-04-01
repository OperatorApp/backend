const query = require("../models/queries")


const saveMessageSer = async (message) => {
    const { thread_id, text, sender, snapshot =null, operator_id = null, lang_detected = null } = message
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

    let snapshotChanged = false
    console.log("this is snapshot", snapshot)
    if (snapshot) {
        snapshotChanged = await saveSnapshotSer(thread_id, snapshot)
    }

    return { ...saved, snapshot, snapshotChanged }
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

























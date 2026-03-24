const query = require("../models/queries")


async function getThreadsSer() {
    const threads = await query.getAllThreads()
    if (!threads) throw new Error("No threads found")
    return threads
}

async function getThreadByIdSer(id) {
    const thread = await query.getThreadById(id)
    if (!thread) throw new Error("Thread not found")
    return thread
}

async function getThreadByIdMessagesSer(id) {
    const messages = await query.getMessagesByThreadId(id)
    if (!messages) throw new Error("No messages found")
    return messages
}

async function postThreadSer(customerId, sessionId) {
    return await query.createThread(customerId, sessionId)
}

async function patchThreadStatus(thread_id, status) {
    const thread = await query.updateThreadStatus(thread_id, status)
    if (!thread) throw new Error("Thread not found")
    return thread
}

async function patchThreadAssign(thread_id, operatorId) {
    const thread = await query.assignThread(thread_id, operatorId)
    if (!thread) throw new Error("Thread not found")
    return thread
}

module.exports={
    getThreadsSer,
    getThreadByIdSer,
    getThreadByIdMessagesSer,
    postThreadSer,
    patchThreadAssign,
    patchThreadStatus
}
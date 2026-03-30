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
    console.log(`getThreadByIdMessagesSer: fetching messages for thread ${id}`)
    const result = await query.getMessagesByThreadId(id)
    console.log(`getThreadByIdMessagesSer: returning ${result.length} messages for thread ${id}`)
    return result
}

async function postThreadSer(customerId, sessionId) {
    let thread = await query.getThreadByCustomerId(customerId)
    if (!thread) {
        thread = await query.createThread(customerId, sessionId)
    }
    return thread
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

async function getThreadByUsernameSer(username) {
    let customer = await query.getCustomerByName(username)
    if (!customer) {
        customer = await query.createCustomer("", username)
    }
    let thread = await query.getThreadByCustomerId(customer.id)
    if (!thread) {
        thread = await query.createThread(customer.id, null)
    }

    return thread
}

module.exports={
    getThreadsSer,
    getThreadByIdSer,
    getThreadByIdMessagesSer,
    postThreadSer,
    patchThreadAssign,
    patchThreadStatus,
    getThreadByUsernameSer
}
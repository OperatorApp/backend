const query = require("../models/queries")


async function getThreadsSer(operatorId = null, filter = {}) {
    const threads = await query.getAllThreads(operatorId, filter)
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

async function postThreadSer(customerId, sessionId, operatorApiKey = null) {
    let thread = await query.getThreadByCustomerId(customerId)
    let operatorId = await query.getOperatorByApiKey(operatorApiKey)
    console.log(`postThreadSer: operatorId for API key ${operatorApiKey} is ${operatorId}`)
    if (!thread) {
        thread = await query.createThread(customerId, sessionId, operatorApiKey)
    }
    return thread
}

async function patchThreadStatus(thread_id, status) {
    return await query.updateThreadStatus(thread_id, status)
}

async function patchThreadAssign(thread_id, operatorId) {
    const thread = await query.assignThread(thread_id, operatorId)
    if (!thread) throw new Error("Thread not found")
    return thread
}

async function getThreadByUsernameSer(username, operatorId) {
    let customer = await query.getCustomerByName(username)
    if (!customer) {
        customer = await query.createCustomer("", username)
    }
    let thread = await query.getThreadByCustomerId(customer.id)
    if (!thread) {
        thread = await query.createThread(customer.id, null, operatorId)
    }

    return thread
}


async function getThreadPaintStateSer(threadId) {
    const state = await query.getThreadPaintState(threadId)

    if (!state) {
        return { scores: {}, base_color: null }
    }

    return {
        scores: state.context_scores ?? {},
        base_color: {
            h: state.base_color_h,
            s: state.base_color_s,
            v: state.base_color_v,
        },
    }
}


module.exports={
    getThreadsSer,
    getThreadByIdSer,
    getThreadByIdMessagesSer,
    postThreadSer,
    patchThreadAssign,
    patchThreadStatus,
    getThreadByUsernameSer,
    getThreadPaintStateSer
}
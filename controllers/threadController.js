const threadService = require("../service/threadService")

const THREAD_ERROR = "Thread service experienced an error"
const ERROR_STATUS = 500

const postThread = async (req, res) => {
    try {
        const { customerId, sessionId } = req.body
        const thread = await threadService.postThreadSer(customerId, sessionId)
        res.json({ success: true, data: thread })
    } catch (err) {
        console.error(THREAD_ERROR, err)
        res.status(ERROR_STATUS).json({ success: false, error: err.message })
    }
}

const getThreadByIdMessages = async (req, res) => {
    try {
        console.log(`getThreadByIdMessages: endpoint called for thread ${req.params.id}`)
        const messages = await threadService.getThreadByIdMessagesSer(Number(req.params.id))
        console.log(`getThreadByIdMessages: returning ${messages.length} messages`)
        res.json({ success: true, data: messages })
    } catch (err) {
        console.error(THREAD_ERROR, err)
        res.status(ERROR_STATUS).json({ success: false, error: err.message })
    }
}

const getThreadById = async (req, res) => {
    try {
        const thread = await threadService.getThreadByIdSer(Number(req.params.id))
        res.json({ success: true, data: thread })
    } catch (err) {
        console.error(THREAD_ERROR, err)
        res.status(ERROR_STATUS).json({ success: false, error: err.message })
    }
}

const getThreads = async (req, res) => {
    try {
        const threads = await threadService.getThreadsSer()
        console.log(threads)
        res.json({ success: true, data: threads })
    } catch (err) {
        console.error(THREAD_ERROR, err)
        res.status(ERROR_STATUS).json({ success: false, error: err.message })
    }
}

const patchAssign = async (req, res) => {
    try {
        const thread = await threadService.patchThreadAssign(Number(req.body.id), req.body.operatorId)
        res.json({ success: true, data: thread })
    } catch (err) {
        console.error(THREAD_ERROR, err)
        res.status(ERROR_STATUS).json({ success: false, error: err.message })
    }
}

const patchStatus = async (req, res) => {
    try {
        const thread = await threadService.patchThreadStatus(Number(req.body.id), req.body.status)
        res.json({ success: true, data: thread })
    } catch (err) {
        console.error(THREAD_ERROR, err)
        res.status(ERROR_STATUS).json({ success: false, error: err.message })
    }
}


const getThreadByUsername = async (req, res) => {
    try {
        const thread = await threadService.getThreadByUsernameSer(req.params.username)
        res.json({ success: true, data: thread })
    } catch (err) {
        console.error(THREAD_ERROR, err)
        res.status(ERROR_STATUS).json({ success: false, error: err.message })
    }
}

module.exports = {
    postThread,
    getThreadByIdMessages,
    getThreadById,
    getThreads,
    patchAssign,
    patchStatus,
    getThreadByUsername
}
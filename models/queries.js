const { PrismaClient } = require("@prisma/client")
const { PrismaPg } = require("@prisma/adapter-pg")

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
// ── Operators ──────────────────────────────────────────

const createOperator = async (username, email, password, name, languages) => {
    return prisma.operator.create({
        data: { username, email, password, name, languages }
    })
}

const getOperatorById = async (id) => {
    return prisma.operator.findUnique({
        where: { id }
    })
}

const getOperatorByUsername = async (username) => {
    return prisma.operator.findUnique({
        where: { username }
    })
}

const getOperatorByEmail = async (email) => {
    return prisma.operator.findUnique({
        where: { email }
    })
}

const getAllOperators = async () => {
    return prisma.operator.findMany({
        select: { id: true, username: true, name: true, email: true, languages: true }
    })
}

// ── Customers ──────────────────────────────────────────

const createCustomer = async (email, name) => {
    return prisma.customer.create({
        data: { email, name }
    })
}

const getCustomerById = async (id) => {
    return prisma.customer.findUnique({
        where: { id },
        include: { orders: true }
    })
}

const getCustomerByEmail = async (email) => {
    return prisma.customer.findUnique({
        where: { email }
    })
}

// ── Threads ────────────────────────────────────────────

const createThread = async (customerId, sessionId) => {
    return prisma.thread.create({
        data: {
            customer_id: customerId,
            session_id: sessionId
        }
    })
}

const getThreadById = async (id) => {
    return prisma.thread.findUnique({
        where: { id },
        include: {
            messages: true,
            customer: true,
            assignedOperator: true,
            snapshot: true
        }
    })
}

const getAllThreads = async () => {
    return prisma.thread.findMany({
        include: {
            customer: true,
            assignedOperator: true,
            messages: {
                orderBy: { created_at: "desc" },
                take: 1  // last message only for preview
            }
        },
        orderBy: { last_message_at: "desc" }
    })
}

const assignThread = async (threadId, operatorId) => {
    return prisma.thread.update({
        where: { id: threadId },
        data: { assigned_to: operatorId }
    })
}

const updateThreadStatus = async (threadId, status) => {
    return prisma.thread.update({
        where: { id: threadId },
        data: { status }
    })
}

// ── Messages ───────────────────────────────────────────

const createMessage = async (threadId, text, sender, operatorId = null, langDetected = null) => {
    return prisma.message.create({
        data: {
            thread_id: threadId,
            text_original: text,
            sender,
            operator_id: operatorId,
            lang_detected: langDetected
        }
    })
}

const getMessagesByThreadId = async (threadId) => {
    return prisma.message.findMany({
        where: { thread_id: threadId },
        include: { operator: true },
        orderBy: { created_at: "asc" }
    })
}

const getMessageById = async (id) => {
    return prisma.message.findUnique({
        where: { id },
        include: { files: true }
    })
}

// update last_message_at on thread after new message
const updateThreadLastMessage = async (threadId) => {
    return prisma.thread.update({
        where: { id: threadId },
        data: { last_message_at: new Date() }
    })
}

module.exports = {
    prisma,
    createOperator,
    getOperatorById,
    getOperatorByUsername,
    getOperatorByEmail,
    getAllOperators,
    createCustomer,
    getCustomerById,
    getCustomerByEmail,
    createThread,
    getThreadById,
    getAllThreads,
    assignThread,
    updateThreadStatus,
    createMessage,
    getMessagesByThreadId,
    getMessageById,
    updateThreadLastMessage
}
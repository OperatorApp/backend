const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()
// ── Operators ──────────────────────────────────────────

const createOperator = async (username, email, password, name, languages) => {
    return prisma.operator.create({
        data: {
            username,
            email,
            password,
            name,
            languages: languages.split(',').map(lang => lang.trim())
        }
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

const addApiKeyToOperator = async (operatorId, apiKey) => {
    return prisma.operator.update({
        where: {id: operatorId},
        data: {api_key: apiKey}
    })
}

const getOperatorByApiKey = async (apiKey) => {
    return prisma.operator.findUnique({
        where: { api_key: apiKey }
    })
}

const getOperatorsLanguages = async (operatorId) => {
    const operator = await prisma.operator.findUnique({
        where: { id: operatorId },
        select: { languages: true }
    })
    return operator?.languages || []
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

const getCustomerByName = async (name) =>{
    return prisma.customer.findFirst({
        where: { name }
    })
}

// ── Threads ────────────────────────────────────────────

const createThread = async (customerId, sessionId, operatorId) => {
    return prisma.thread.create({
        data: {
            customer_id: customerId,
            session_id: sessionId,
            assigned_to: operatorId
        }
    })
}

const getThreadById = async (id) => {
    return prisma.thread.findUnique({
        where: { id },
        include: {
            messages: {
                orderBy: { created_at: 'asc' }
            },
            customer: true,
            assignedOperator: true,
            snapshot: true
        }
    })
}

const getAllThreads = async (operatorId = null) => {
    return prisma.thread.findMany({
        where: operatorId ? { assigned_to: operatorId } : {},
        include: {
            customer: true,
            assignedOperator: true,
            messages: {
                orderBy: { created_at: "desc" },
                take: 1
            },
            snapshot: true
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

const getThreadByCustomerId = async (customer_id) => {
    return prisma.thread.findFirst(
        {
            where: {customer_id}
        }
    )
}

// ── Messages ───────────────────────────────────────────

const createMessage = async (threadId, text, sender, operatorId = null, langDetected = null, textTranslated = "") => {
    const result = await prisma.message.create({
        data: {
            thread: { connect: { id: threadId } },
            text_original: text,
            sender,
            lang_detected: langDetected,
            text_translated: textTranslated,
            ...(operatorId && { operator: { connect: { id: operatorId } } })
        }
    })
    console.log(`createMessage: successfully created message with ID ${result.id}`)
    return result
}

const getMessagesByThreadId = async (threadId) => {
    console.log(`getMessagesByThreadId: fetching messages for thread ${threadId}`)
    const messages = await prisma.message.findMany({
        where: { thread_id: threadId },
        include: { operator: true },
        orderBy: { created_at: "asc" }
    })
    console.log(`getMessagesByThreadId: found ${messages.length} messages for thread ${threadId}`)
    return messages
}

const getMessageById = async (id) => {
    return prisma.message.findUnique({
        where: { id },
        include: { files: true }
    })
}

const updateThreadLastMessage = async (threadId) => {
    return prisma.thread.update({
        where: { id: threadId },
        data: { last_message_at: new Date() }
    })
}

const getLastCustomerLang = async (threadId) => {
    const lastMsg = await prisma.message.findFirst({
        where: { thread_id: threadId, sender: "CUSTOMER" },
        orderBy: { created_at: "desc" }
    })
    return lastMsg?.lang_detected || null
}

// ── Snapshots ─────────────────────────────────────────

const getSnapshotByThreadId = async (threadId) => {
    return prisma.sessionContextSnapshot.findUnique({
        where: { thread_id: threadId }
    })
}

const upsertSnapshot = async (threadId, snapshot) => {
    return prisma.sessionContextSnapshot.upsert({
        where: { thread_id: threadId },
        update: {
            country: snapshot.country,
            city: snapshot.city,
            local_time: snapshot.local_time,
            url_trail: snapshot.url_trail,
            cart_snapshot: snapshot.cart_snapshot,
            sentiment_label: snapshot.sentiment_label,
            sentiment_conf: snapshot.sentiment_conf
        },
        create: {
            thread_id: threadId,
            country: snapshot.country,
            city: snapshot.city,
            local_time: snapshot.local_time,
            url_trail: snapshot.url_trail,
            cart_snapshot: snapshot.cart_snapshot,
            sentiment_label: snapshot.sentiment_label,
            sentiment_conf: snapshot.sentiment_conf
        }
    })
}

//Knowledge

const upsertKnowledge = async (operatorId, content) => {
    return prisma.knowledgeBase.upsert({
        where: { operator_id: operatorId },
        update: { content },
        create: { operator_id: operatorId, content }
    })
}


//Vectors
const updateOperatorVectorStore = async (operatorId, vectorStoreId, vectorFileId) => {
    return prisma.operator.update({
        where: { id: operatorId },
        data: {
            vector_store_id: vectorStoreId,
            vector_file_id: vectorFileId
        }
    })
}

const getOperatorVectorInfo = async (operatorId) => {
    return prisma.operator.findUnique({
        where: { id: operatorId },
        select: { vector_store_id: true, vector_file_id: true }
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
    updateThreadLastMessage,
    getCustomerByName,
    getThreadByCustomerId,
    getSnapshotByThreadId,
    upsertSnapshot,
    getLastCustomerLang,
    addApiKeyToOperator,
    upsertKnowledge,
    updateOperatorVectorStore,
    getOperatorVectorInfo,
    getOperatorsLanguages
}
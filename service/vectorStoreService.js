const query = require("../models/queries")

const OPENAI_URL = "https://api.openai.com/v1"
const AUTH = { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` }
const HEADERS = { ...AUTH, "Content-Type": "application/json", "OpenAI-Beta": "assistants=v2" }

const createVectorStore = async (operatorId) => {
    const res = await fetch(`${OPENAI_URL}/vector_stores`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({ name: `knowledge-operator-${operatorId}` })
    })
    if (!res.ok) throw new Error("Failed to create vector store")
    const store = await res.json()
    return store.id
}

const uploadFile = async (content, operatorId) => {
    const formData = new FormData()
    const blob = new Blob([content], { type: "text/plain" })
    formData.append("purpose", "assistants")
    formData.append("file", blob, `knowledge-${operatorId}.txt`)

    const res = await fetch(`${OPENAI_URL}/files`, {
        method: "POST",
        headers: AUTH,
        body: formData
    })
    if (!res.ok) throw new Error("Failed to upload file")
    const file = await res.json()
    return file.id
}

const deleteFile = async (fileId) => {
    try {
        await fetch(`${OPENAI_URL}/files/${fileId}`, {
            method: "DELETE",
            headers: AUTH
        })
    } catch (err) {
        console.error("Failed to delete old file:", err)
    }
}

const removeFileFromStore = async (vectorStoreId, fileId) => {
    try {
        await fetch(`${OPENAI_URL}/vector_stores/${vectorStoreId}/files/${fileId}`, {
            method: "DELETE",
            headers: HEADERS
        })
    } catch (err) {
        console.error("Failed to remove file from store:", err)
    }
}

const attachFileToStore = async (vectorStoreId, fileId) => {
    const res = await fetch(`${OPENAI_URL}/vector_stores/${vectorStoreId}/files`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({ file_id: fileId })
    })
    if (!res.ok) throw new Error("Failed to attach file to store")
}

const syncKnowledgeToVectorStore = async (operatorId, content) => {
    let vectorInfo = await query.getOperatorVectorInfo(operatorId)
    let vectorStoreId = vectorInfo?.vector_store_id
    let oldFileId = vectorInfo?.vector_file_id
    if (!vectorStoreId) {
        vectorStoreId = await createVectorStore(operatorId)
    }
    const newFileId = await uploadFile(content, operatorId)
    if (oldFileId) {
        await removeFileFromStore(vectorStoreId, oldFileId)
        await deleteFile(oldFileId)
    }
    await attachFileToStore(vectorStoreId, newFileId)
    await query.updateOperatorVectorStore(operatorId, vectorStoreId, newFileId)

    console.log(`Knowledge synced for operator ${operatorId}`)
    return vectorStoreId
}

module.exports = { syncKnowledgeToVectorStore }
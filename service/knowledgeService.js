const query = require("../models/queries")
const { syncKnowledgeToVectorStore } = require("./vectorStoreService")

const upsertKnowledge = async (operatorId, content) => {
    const entry = await query.upsertKnowledge(operatorId, content)
    await syncKnowledgeToVectorStore(operatorId, content)
    return entry
}

const getKnowledge = async (operatorId) => {
    return query.getKnowledge(operatorId)
}

module.exports = { upsertKnowledge, getKnowledge }
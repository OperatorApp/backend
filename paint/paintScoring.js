
const { SECTION_CATALOG, SCORING_CONFIG } = require("./paintCatalog")

function normalizeText(text) {
    if (!text) return ""
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
}

function tokenizeMessage(text) {
    return normalizeText(text)
        .split(/[^a-z0-9]+/)
        .filter(Boolean)
}


function resolvePath(obj, path) {
    if (!obj || !path) return []
    const parts = path.split(".")
    let current = [obj]

    for (const part of parts) {
        const next = []
        const arrayMatch = part.match(/^(.+)\[\*\]$/)

        if (arrayMatch) {
            const key = arrayMatch[1]
            for (const item of current) {
                if (item && Array.isArray(item[key])) next.push(...item[key])
            }
        } else {
            for (const item of current) {
                if (item != null && item[part] !== undefined) next.push(item[part])
            }
        }
        current = next
    }
    return current.filter(v => v != null)
}


function extractSectionEntities(snapshot, entityPaths) {
    const raw = []
    for (const path of entityPaths || []) {
        raw.push(...resolvePath(snapshot, path))
    }
    return raw
        .map(String)
        .map(normalizeText)
        .filter(e => e.length > 1)
}


function computeKeywordBoost(tokens, keywords) {
    if (!keywords?.length) return 0
    const tokenSet = new Set(tokens)
    const joined = tokens.join(" ")
    let boost = 0

    for (const kw of keywords) {
        const norm = normalizeText(kw)
        const isPhrase = norm.includes(" ")
        const hit = isPhrase ? joined.includes(norm) : tokenSet.has(norm)
        if (hit) boost += SCORING_CONFIG.KEYWORD_WEIGHT
    }
    return boost
}

function computeEntityBoost(normalizedMessage, entities) {
    if (!entities?.length) return 0
    let boost = 0
    for (const entity of entities) {
        if (normalizedMessage.includes(entity)) {
            boost += SCORING_CONFIG.ENTITY_WEIGHT
        }
    }
    return boost
}

function computeSectionBoost(section, normalizedMessage, tokens, snapshot, language) {
    const keywords = section.keywords?.[language] ?? section.keywords?.en ?? []
    const entities = extractSectionEntities(snapshot, section.entity_paths)

    const keywordBoost = computeKeywordBoost(tokens, keywords)
    const entityBoost = computeEntityBoost(normalizedMessage, entities)

    return Math.min(SCORING_CONFIG.PER_MESSAGE_BOOST_CAP, keywordBoost + entityBoost)
}


function getSenderWeight(senderType) {
    switch (senderType) {
        case "CUSTOMER": return SCORING_CONFIG.CUSTOMER_MESSAGE_WEIGHT
        case "OPERATOR": return SCORING_CONFIG.OPERATOR_MESSAGE_WEIGHT
        case "SYSTEM":   return SCORING_CONFIG.SYSTEM_MESSAGE_WEIGHT
        default:         return 0
    }
}


function applyDecayToScore(prevScore, decayFactor) {
    return prevScore * decayFactor
}

function decayAllScores(prevScores, catalog) {
    const decayed = {}
    for (const section of catalog) {
        const prior = prevScores[section.id] ?? 0
        const decay = section.decay ?? SCORING_CONFIG.DEFAULT_DECAY
        decayed[section.id] = applyDecayToScore(prior, decay)
    }
    return decayed
}

function clampScore(score) {
    if (score < 0) return 0
    if (score > 1) return 1
    return score
}

function computeNewScores({ prevScores, messageText, snapshot, senderType, language }) {
    console.log("[scoring] called with:", {
        senderType,
        language,
        messageText,
        hasSnapshot: !!snapshot,
        prevScores,
    })

    const catalog = SECTION_CATALOG
    const decayed = decayAllScores(prevScores ?? {}, catalog)
    const senderWeight = getSenderWeight(senderType)

    console.log("[scoring] senderWeight:", senderWeight)

    if (senderWeight === 0 || !messageText) {
        console.log("[scoring] early return — no boost will be applied")
        return decayed
    }

    const normalizedMessage = normalizeText(messageText)
    const tokens = tokenizeMessage(messageText)

    console.log("[scoring] tokens:", tokens)

    const newScores = {}

    for (const section of catalog) {
        const boost = computeSectionBoost(section, normalizedMessage, tokens, snapshot, language)
        if (boost > 0) {
            console.log(`[scoring] ${section.id} boost:`, boost)
        }
        const weightedBoost = boost * senderWeight
        newScores[section.id] = clampScore(decayed[section.id] + weightedBoost)
    }

    console.log("[scoring] final scores:", newScores)
    return newScores
}


module.exports = {
    normalizeText,
    tokenizeMessage,
    resolvePath,
    extractSectionEntities,
    computeKeywordBoost,
    computeEntityBoost,
    computeSectionBoost,
    getSenderWeight,
    applyDecayToScore,
    decayAllScores,
    clampScore,
    computeNewScores,
}
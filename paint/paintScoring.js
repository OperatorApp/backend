
const { SECTION_CATALOG, SCORING_CONFIG } = require("./paintCatalog")
const {scoreSectionsSemantically} = require("../service/aiService");

function normalizeText(text) {
    if (!text) return ""
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
}

function tokenizeMessage(text) {
    return normalizeText(text)
        .split(/[^\p{L}\p{N}]+/u)
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


function computeKeywordBoostForLang(section, tokens, language) {
    const keywords = section.keywords?.[language] ?? section.keywords?.en ?? []
    return computeKeywordBoost(tokens, keywords)
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

async function computeNewScores({ prevScores, messageText, messageTextTranslated, snapshot, senderType, language }) {
    const catalog = SECTION_CATALOG
    const decayed = decayAllScores(prevScores ?? {}, catalog)
    const senderWeight = getSenderWeight(senderType)

    if (senderWeight === 0 || !messageText) return decayed

    const normalizedOriginal = normalizeText(messageText)
    const tokensOriginal = tokenizeMessage(messageText)
    const hasTranslation = messageTextTranslated && messageTextTranslated !== messageText
    const tokensTranslated = hasTranslation ? tokenizeMessage(messageTextTranslated) : null

    let aiScores = {}
    const eligibleForAi =
        SCORING_CONFIG.AI_ENABLED &&
        senderType === "CUSTOMER" &&
        messageText.length >= SCORING_CONFIG.AI_MIN_MESSAGE_LENGTH

    if (eligibleForAi) {
        try {
            const textForAi = messageTextTranslated || messageText
            aiScores = await scoreSectionsSemantically(textForAi, catalog, snapshot)
            console.log("[scoring] ai scores:", aiScores)
        } catch (err) {
            console.warn("[scoring] AI scoring failed, using heuristics only:", err.message)
        }
    }

    const newScores = {}

    for (const section of catalog) {
        const entities = extractSectionEntities(snapshot, section.entity_paths)
        const entityBoost = computeEntityBoost(normalizedOriginal, entities)
        const kwOriginal = computeKeywordBoostForLang(section, tokensOriginal, language)
        const kwTranslated = tokensTranslated
            ? computeKeywordBoostForLang(section, tokensTranslated, "en")
            : 0
        const keywordBoost = Math.max(kwOriginal, kwTranslated)
        const heuristicBoost = Math.min(
            SCORING_CONFIG.PER_MESSAGE_BOOST_CAP,
            keywordBoost + entityBoost
        )

        const aiRaw = Math.max(0, Math.min(1, aiScores[section.id] ?? 0))
        const aiBoost = aiRaw * SCORING_CONFIG.AI_WEIGHT

        const combinedBoost = Math.min(
            SCORING_CONFIG.AI_TOTAL_BOOST_CAP,
            heuristicBoost + aiBoost
        )

        if (combinedBoost > 0) {
            console.log(`[scoring] ${section.id}: heuristic=${heuristicBoost.toFixed(2)} ai=${aiBoost.toFixed(2)} → ${combinedBoost.toFixed(2)}`)
        }

        const weightedBoost = combinedBoost * senderWeight
        newScores[section.id] = clampScore(decayed[section.id] + weightedBoost)
    }

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
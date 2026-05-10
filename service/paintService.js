const paintQueries = require("../models/queries")
const { computeNewScores } = require("../paint/paintScoring")
const { SCORING_CONFIG } = require("../paint/paintCatalog")

function generateThreadHue(thread_id) {
    return (thread_id * 137.508) % 360
}

async function getOrInitPaintState(thread_id) {
    let state = await paintQueries.getThreadPaintState(thread_id)

    if (!state) {
        state = await paintQueries.createThreadPaintState(thread_id, {
            context_scores: {},
            scoring_version: SCORING_CONFIG.SCORING_VERSION,
            last_processed_message_id: null,
            base_color_h: generateThreadHue(thread_id),
            base_color_s: 0.5,
            base_color_v: 0.9,
        })
        return state
    }

    if (state.scoring_version !== SCORING_CONFIG.SCORING_VERSION) {
        state = await paintQueries.updateThreadPaintState(thread_id, {
            context_scores: {},
            scoring_version: SCORING_CONFIG.SCORING_VERSION,
            last_processed_message_id: null,
        })
    }

    return state
}

function shouldProcessMessage(state, messageId) {
    if (state.last_processed_message_id == null) return true
    return messageId > state.last_processed_message_id
}

async function updateThreadPaintState(thread_id, message) {
    const state = await getOrInitPaintState(thread_id)

    if (!shouldProcessMessage(state, message.id)) {
        return state
    }

    const snapshot = await paintQueries.getSnapshot(thread_id)

    if (!message.detected_lang){
        console.warn(`Message ${message.id} is missing detected language, defaulting to "en"`)
    }

    const newScores = await computeNewScores({
        prevScores: state.context_scores ?? {},
        messageText: message.text,
        messageTextTranslated: message.text_translated,
        snapshot,
        senderType: message.sender,
        language: message.detected_lang ?? "en",
    })

    return paintQueries.updateThreadPaintState(thread_id, {
        context_scores: newScores,
        last_processed_message_id: message.id,
    })
}



async function getThreadPaintStateSer(threadId) {
    const state = await paintQueries.getThreadPaintState(threadId)

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

module.exports = {
    updateThreadPaintState,
    getThreadPaintStateSer,
}
const {saveMessageSer} = require("../service/realTimeChatService");
const threadService = require("../service/threadService");
const {updateThreadPaintState} = require("../service/paintService");


const saveMessage = async (socket, io, data) => {
    try {
        console.log("incoming message:", data)
        await threadService.patchThreadStatus(data.thread_id, "PENDING")
        data.operator_id = socket.operatorId
        const saved = await saveMessageSer(data)
        io.to(`thread_${data.thread_id}`).emit("message", {
            success: true,
            event: "new_message",
            data: saved,
        })

        io.to("operators").emit("thread_updated", {
            success: true,
            event: "thread_updated",
            data: {
                thread_id: data.thread_id,
                status: "PENDING",
                last_message: saved,
            },
        })
        console.log("this is saved message:", saved)
        updateThreadPaintState(data.thread_id, {
            id: saved.id,
            text: saved.text_original,
            sender: data.sender.toUpperCase(),
            detected_lang: saved.lang ?? null,
        })
            .then(paintState => {
                io.to(`thread_${data.thread_id}`).emit("paint_updated", {
                    success: true,
                    event: "paint_updated",
                    data: {
                        thread_id: data.thread_id,
                        scores: paintState.context_scores,
                        base_color: {
                            h: paintState.base_color_h,
                            s: paintState.base_color_s,
                            v: paintState.base_color_v,
                        },
                    },
                })
            })
            .catch(err => {
                console.error("Paint state update failed:", err)
            })
    } catch (err) {
        console.error("saveMessage error:", err)
        io.to(`thread_${data.thread_id}`).emit("message", {
            success: false,
            event: "new_message",
            error: "Failed to save message"
        })
    }
}



module.exports = {
    saveMessage
}







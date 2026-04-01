const {saveMessageSer} = require("../service/realTimeChatService");
const threadService = require("../service/threadService");


const saveMessage = async (socket, io, data) => {
    try {
        console.log("incoming message:", data)
        await threadService.patchThreadStatus(data.thread_id, "PENDING")
        const saved = await saveMessageSer(data)
        console.log("saved message", data)
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







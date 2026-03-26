const {saveMessageSer} = require("../service/realTimeChatService");


const saveMessage = async (socket, io, data) => {
    try {
        console.log("incoming message:", data)
        const saved = await saveMessageSer(data)
        io.to(`thread_${data.thread_id}`).emit("message", {
            success: true,
            event: "new_message",
            data: saved
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







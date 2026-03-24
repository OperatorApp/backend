const realTimeChatController = require("../controllers/realTimeChatController")

module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log("client connected", socket.id)

        socket.on("join_thread", (threadId) => {
            socket.join(`thread_${threadId}`)
        })

        socket.on("send_message", (data) => {
            realTimeChatController.saveMessage(socket, io, data)
        })

        socket.on("disconnect", () => {
            console.log("disconnected", socket.id)
        })
    })
}
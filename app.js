require("dotenv").config()
const express = require("express")
const { createServer } = require("node:http")
const { Server } = require("socket.io")
const cors = require("cors")
const authRoutes = require("./routes/auth")
const threadRoutes = require("./routes/thread")
const aiRoutes = require("./routes/ai")
const app = express()
const server = createServer(app)

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5174", "http://localhost:5173"],
        methods: ["GET", "POST"],
        credentials: true
    }
})



app.use(cors({ origin: ["http://localhost:5174", "http://localhost:5173"], credentials: true }))
app.use(express.urlencoded({ extended: true }))

app.use(express.json({ limit: '100mb' }))


app.use("/auth", authRoutes)
app.use("/thread", threadRoutes)
app.use("/ai", aiRoutes)

require("./config/socket")(io)

server.listen(process.env.PORT, () => console.log(`Listening on port ${process.env.PORT}`))

module.exports = { io }
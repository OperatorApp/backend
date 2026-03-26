require("dotenv").config()
const express = require("express")
const { createServer } = require("node:http")
const { Server } = require("socket.io")
const cors = require("cors")
const authRoutes = require("./routes/auth")
const threadRoutes = require("./routes/thread")
const apicache = require('apicache');

const app = express()
const server = createServer(app)

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
})

let cache = apicache.middleware;

app.use(cors({ origin: "http://localhost:5173" }))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use(cache('10 minutes', (_req) => {
    return !_req.url.includes('/messages')
}))

app.use("/auth", authRoutes)
app.use("/thread", threadRoutes)

require("./config/socket")(io)

server.listen(process.env.PORT, () => console.log(`Listening on port ${process.env.PORT}`))

module.exports = { io }
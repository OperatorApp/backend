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
const { dynamicCors } = require('./middleware/cors.middleware');

const io = new Server(server, {
    cors: {
        origin: async (origin, callback) => {
            const internalOrigins = ["http://localhost:5173"];
            if (!origin || internalOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(null, true);
        },
        methods: ["GET", "POST"],
        credentials: true
    }
});


app.use(dynamicCors);

app.use(express.urlencoded({ extended: true }))

app.use(express.json({ limit: '100mb' }))


app.use("/auth", authRoutes)
app.use("/thread", threadRoutes)
app.use("/ai", aiRoutes)

require("./config/socket")(io)

server.listen(process.env.PORT, () => console.log(`Listening on port ${process.env.PORT}`))

module.exports = { io }

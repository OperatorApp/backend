const realTimeChatController = require("../controllers/realTimeChatController")

const crypto = require('node:crypto')
const jwt = require('jsonwebtoken')
const { prisma } = require('../models/queries');

const socket_ = (io) => {
    io.use(async (socket, next) => {
        const origin = socket.handshake.headers?.origin;
        const internalOrigins = ["http://localhost:5174", "http://localhost:5173"];

        const apiKey = socket.handshake.auth?.apiKey;
        if (apiKey) {
            const hashed = crypto.createHash('sha256').update(apiKey).digest('hex');
            const operator = await prisma.operator.findFirst({
                where: { api_key: hashed }
            });

            if (!operator) return next(new Error("Invalid API key"));

            if (origin && !internalOrigins.includes(origin)) {
                if (!operator.allowed_origins.includes(origin)) {
                    return next(new Error("Origin not allowed"));
                }
            }

            socket.operatorId = operator.id;
            socket.authType = 'api_key';
            return next();
        }

        const token = socket.handshake.auth?.token;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const operator = await prisma.operator.findUnique({
                    where: { id: decoded.id }
                });
                if (operator) {
                    socket.operatorId = operator.id;
                    socket.authType = 'token';
                    return next();
                }
            } catch (err) {}
        }

        next(new Error("Authentication required"));
    });

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

        socket.on("join_operator_threads", () => {
            socket.join("operators")
        })

        socket.on("leave_operator_threads", () => {
            socket.leave("operators")
        })
    })
};
module.exports = socket_;
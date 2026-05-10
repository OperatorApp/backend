const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const { prisma } = require('../models/queries');

const authenticateAny = async (req, res, next) => {
    const apiKey = req.headers['x-api-key']
    if (apiKey) {
        const hashed = crypto.createHash('sha256').update(apiKey).digest('hex')
        const operator = await prisma.operator.findFirst({
            where: { api_key: hashed }
        })
        if (operator) {
            req.operator = operator
            req.authType = 'api_key'
            req.operatorId = operator.id
            return next()
        }
    }

    const token = req.headers['authorization']?.split(' ')[1]
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            const operator = await prisma.operator.findUnique({
                where: { id: decoded.id }
            })
            if (operator) {
                req.operator = operator
                req.operatorId = operator.id
                req.authType = 'token'
                return next()
            }
        } catch (err) {}
    }

    return res.status(401).json({ error: "Authentication required" })
}


module.exports = { authenticateAny }
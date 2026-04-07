
const crypto = require('node:crypto')
const { prisma } = require('../models/queries');



const validateApiKey = async (req, res, next) => {
    const key = req.headers['x-api-key']
    if (!key) return res.status(401).json({ error: "API key required" })

    const hashed = crypto.createHash('sha256').update(key).digest('hex')
    const operator = await prisma.operator.findFirst({
        where: { api_key: hashed }
    })

    if (!operator) return res.status(401).json({ error: "Invalid API key" })

    req.operator = operator
    next()
}


module.exports = { validateApiKey }
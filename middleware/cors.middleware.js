// cors.middleware.js
const crypto = require('node:crypto')
const { prisma } = require('../models/queries');

const dynamicCors = async (req, res, next) => {
    const origin = req.headers['origin'];
    const internalOrigins = [process.env.INTERNAL_FRONTEND_URL];

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Internal frontend — pass through without API key
    if (!origin || internalOrigins.includes(origin)) {
        if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
        if (req.method === 'OPTIONS') return res.sendStatus(204);
        return next();
    }

    // External origin — set origin header first (so browser can read errors)
    res.setHeader('Access-Control-Allow-Origin', origin);
    if (req.method === 'OPTIONS') return res.sendStatus(204);

    // Then validate API key
    const key = req.headers['x-api-key'];
    if (!key) return res.status(401).json({ error: 'API key required' });

    const hashed = crypto.createHash('sha256').update(key).digest('hex');
    const operator = await prisma.operator.findFirst({
        where: { api_key: hashed }
    });

    if (!operator) return res.status(401).json({ error: 'Invalid API key' });

    req.operator = operator;
    req.operatorId = operator.id;
    next();
};

module.exports = { dynamicCors };
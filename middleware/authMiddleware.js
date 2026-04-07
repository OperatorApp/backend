const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];


    if (!token) {
        console.log('No token provided in request headers');
        return res.status(401).json({ success: false, error: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log('Token verification error:', err);
            return res.status(403).json({ success: false, error: 'Invalid token' });
        }
        req.operatorId = decoded.id;
        next();
    });
};

module.exports = { authenticateToken };
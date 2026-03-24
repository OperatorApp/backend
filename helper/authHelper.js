
const bcryptjs = require("bcryptjs");
const {verify} = require("jsonwebtoken");

async function validPassword(password, hash) {
    return  await bcryptjs.compare(password, hash);
}


async function genPassword(password) {
    return  await bcryptjs.hash(password, 10);
}

//https://github.com/bradtraversy/node_jwt_example/blob/master/app.js
function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if(typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.sendStatus(403);
    }
}


function verifyUser(req, res, next) {
    verify(req.token, process.env.SESSION_SECRET, (err, authData) => {
        if(err) {
            res.sendStatus(403);
        } else {
            next();
        }
    });
}



module.exports = {
    validPassword,
    genPassword,
    verifyToken
}
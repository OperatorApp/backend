const {genPassword, validPassword} = require("../helper/authHelper")
const jwt = require('jsonwebtoken');
const {getUserFromUsername, createNewUser} = require("../models/queries");


const login = async (req, res) => {
    const user = await getUserFromUsername(req.body.username)
    if (!user) return res.status(401).json({ success: false, error: "Invalid credentials" })

    const match = await validPassword(req.body.password, user.password)
    if (!match) return res.status(401).json({ success: false, error: "Invalid credentials" })

    const token = await jwt.sign({ id: user.id }, process.env.SESSION_SECRET, { expiresIn: "7d" })
    res.json({ success: true, token })
}


const signup = async (req, res) => {
    try {
        const hash = await genPassword(req.body.password)
        const user = await createNewUser(req.body.username, hash, false)
        res.json({
            success: true,
            data: {
                id: user.id,
                username: user.username
            }
        })
    } catch (err) {
        res.status(500).json({ success: false, error: "Username already exists" })
    }
}

const logout = (req, res) => {
    req.logout(() => {
        res.json({
            success: true,
            data: {}
        })
    })
}


module.exports = {
    login,
    signup,
    logout
}










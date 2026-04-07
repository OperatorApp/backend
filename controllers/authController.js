const { loginSer, signupSer,createApiKeySer } = require("../service/authService")

const AUTH_ERROR = "Auth service experienced an error"

const login = async (req, res) => {
    try {
        const { username, password } = req.body
        console.log("Login attempt:", username)
        const data = await loginSer(username, password)
        res.json({ success: true, data })
    } catch (err) {
        console.error(AUTH_ERROR, err)
        res.status(401).json({ success: false, error: err.message })
    }
}

const signup = async (req, res) => {
    try {
        const { username, email, password, name, languages } = req.body
        const data = await signupSer(username, email, password, name, languages)
        res.json({ success: true, data })
    } catch (err) {
        console.error(AUTH_ERROR, err)
        res.status(500).json({ success: false, error: "Username or email already exists" })
    }
}

const logout = (req, res) => {
    res.json({ success: true, data: {} })
}


const createApiKey = async (req, res) => {
    try {
        const operatorId = req.operatorId
        const apiKey = await createApiKeySer(operatorId)

        res.json({success: true, data: {apiKey}})
    } catch (err) {
        console.error(AUTH_ERROR, err)
        res.status(500).json({success: false, error: "Failed to create API key"})
    }
}

module.exports = { login, signup, logout, createApiKey }
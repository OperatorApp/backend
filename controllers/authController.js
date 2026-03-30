const { loginSer, signupSer } = require("../service/authService")

const AUTH_ERROR = "Auth service experienced an error"

const login = async (req, res) => {
    try {
        const { username, password } = req.body
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

module.exports = { login, signup, logout }
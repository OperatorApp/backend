const { genPassword, validPassword } = require("../helper/authHelper")
const { getUserFromUsername, createOperator, getOperatorByUsername } = require("../models/queries")
const jwt = require("jsonwebtoken")

const AUTH_ERROR = "Auth service experienced an error"

const loginSer = async (username, password) => {
    const operator = await getOperatorByUsername(username)
    if (!operator) throw new Error("Invalid credentials")

    const match = await validPassword(password, operator.password)
    if (!match) throw new Error("Invalid credentials")

    const token = jwt.sign({ id: operator.id }, process.env.JWT_SECRET, { expiresIn: "7d" })
    return { token, operator: { id: operator.id, username: operator.username } }
}

const signupSer = async (username, email, password, name, languages) => {
    const hash = await genPassword(password)
    const operator = await createOperator(username, email, hash, name, languages)
    return { id: operator.id, username: operator.username }
}

module.exports = { loginSer, signupSer }
const express = require("express")
require("dotenv").config()
const session = require("express-session")
const passport = require("./config/passport")


const authRoutes = require("./routes/auth")

const app = express()

app.set("view engine", "ejs")

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static("public"))
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}))
app.use(passport.initialize())
app.use(passport.session())


app.use("/auth", authRoutes)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Listening on port ${PORT}`))
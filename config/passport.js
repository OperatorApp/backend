const passport = require("passport")
const JwtStrategy = require("passport-jwt").Strategy
const ExtractJwt = require("passport-jwt").ExtractJwt
const { getUserfromId } = require("../models/queries")

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.SESSION_SECRET
}

passport.use(
    new JwtStrategy(options, async (payload, done) => {
        try {
            const user = await getUserfromId(payload.id)
            if (!user) return done(null, false)
            return done(null, user)
        } catch(err) {
            return done(err)
        }
    })
)

passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
    try {
        const user = await getUserfromId(id)
        done(null, user)
    } catch(err) {
        done(err)
    }
})

module.exports = passport
var passport = require('passport')
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
const { PrismaClient } = require('@prisma/client')

// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
    },
    async function (accessToken, refreshToken, profile, done) {
      return done(null, {
        ...profile,
        token: accessToken,
      })
    },
  ),
)

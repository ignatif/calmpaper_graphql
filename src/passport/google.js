var passport = require('passport')
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
const { PrismaClient } = require('@prisma/client')

const stream = require('getstream').default
const getStreamClient = stream.connect(
  'c2u3fw52wm4t',
  'grdr5z6ras7ugc33ezbqswq6k6pggrad4armpg3xjskpgp7gwttmqjgyfg86pn8z',
)

// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.
passport.use(
  new GoogleStrategy(
    {
      clientID:
        '335114584327-634nqa511l75d71ov4275gp00k0qqpct.apps.googleusercontent.com',
      clientSecret: 'vTVx_tRL70hL1fCFPVUpDDpj',
      callbackURL: 'http://ignatif.me:4000/auth/google/callback',
    },
    async function (accessToken, refreshToken, profile, done) {

      return done(null, {
        ...profile,
        token: accessToken,
      })
    },
  ),
)

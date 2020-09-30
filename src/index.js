require('dotenv').config()
const { GraphQLServer } = require('graphql-yoga')
const { makeSchema, objectType, intArg, stringArg } = require('@nexus/schema')
const { PrismaClient } = require('@prisma/client')
const { nexusPrismaPlugin } = require('nexus-prisma')
const {
  Query,
  Mutation,
  User,
  Book,
  Chapter,
  Comment,
  Like,
  Review,
  Tag,
  Genre,
  Donation,
  AuthPayload,
} = require('./graphql')
const { permissions } = require('./middlewares/permissions')
const { notifications } = require('./middlewares/notifications')
const express = require('express')
const multer = require('multer')
const multerS3 = require('multer-s3')
const cors = require('cors')
const CryptoJS = require('crypto-js')

var passport = require('passport')
const { sign } = require('jsonwebtoken')
require('./middlewares/authentication/google')

const APP_SECRET = 'appsecret321'

const stream = require('getstream').default
const getStreamClient = stream.connect(
  process.env.GETSTREAM_KEY,
  process.env.GETSTREAM_SECRET,
)

const { applyMiddleware } = require('graphql-middleware')

var session = require('express-session'),
  bodyParser = require('body-parser')

const prisma = new PrismaClient()

let schema = makeSchema({
  types: [
    Query,
    Mutation,
    User,
    Book,
    Chapter,
    Comment,
    Like,
    Review,
    Tag,
    Genre,
    Donation,
    AuthPayload,
  ],
  plugins: [nexusPrismaPlugin()],
  experimentalCRUD: true,
  outputs: {
    schema: __dirname + '/../schema.graphql',
  },
})

schema = applyMiddleware(schema, notifications, permissions)

const stipeNode = require('stripe')
const stripe = stipeNode(process.env.STRIPE_SECRET_KEY)

const server = new GraphQLServer({
  schema,
  context: (request) => {
    return {
      ...request,
      prisma,
      stripe,
    }
  },
})

server.express.use(cors())

// health check
server.express.use('/hi', (req, res) => {
  res.status(200).json({ ok: true })
})

// file upload
server.express.use(express.static('public'))
server.express.use(
  bodyParser.urlencoded({
    parameterLimit: 100000,
    limit: '50mb',
    extended: false,
  }),
)
server.express.use(bodyParser.json({ limit: '50mb', type: 'application/json' }))
server.express.use(bodyParser.json())

const storage = multer.diskStorage({
  destination: './files',
  filename(req, file, cb) {
    cb(null, `${new Date()}-${file.originalname}`)
  },
})

const upload = multer({ storage })

server.express.use('/files', express.static('files'))
server.express.post('/files', upload.single('file'), (req, res) => {
  const file = req.file // file passed from client
  const meta = req.body // all other values passed from the client, like name, etc..

  res.status(200).json({ path: file.path })
})

server.express.use(express.json())
server.express.use(
  express.urlencoded({
    parameterLimit: 100000,
    limit: '100mb',
    extended: false,
  }),
)

// auth
server.express.use(session({ secret: process.env.APP_SECRET }))
passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((obj, done) => done(null, obj))
server.express.use(session({ secret: 'cats' }))
server.express.use(passport.initialize())
server.express.use(passport.session())

server.express.get(
  '/auth/google',
  function (req, res, next) {
    req.session.from = req.query.from
    next()
  },
  passport.authenticate('google', {
    scope: [
      'https://www.googleapis.com/auth/plus.login',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  }),
)

// Uncomment to create first user
// server.express.get(
//   '/auth/google/callback',
//   passport.authenticate('google', { failureRedirect: '/login' }),
//   async function (req, res) {
//     const { user: profile } = req

//     const getStreamToken = getStreamClient.createUserToken(profile.id)
//     const user = await prisma.user.create({
//       data: {
//         googleId: profile.id,
//         fullname: profile.displayName,
//         firstname: profile.name.familyName,
//         givenname: profile.name.givenName,
//         avatar: profile.photos[0].value,
//         email: profile.emails[0].value,
//         getStreamToken,
//       },
//     })
//     var token = sign({ userId: user.id }, APP_SECRET)

//     res.redirect(`${process.env.FRONTEND_URL}/?token=${token}`)
//   },
// )
//

server.express.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async function (req, res) {
    let user
    const { user: profile } = req

    // 1) User is already registered
    user = await prisma.user.findOne({
      where: {
        googleId: profile.id,
      },
    })

    // 2) No invite and not registered
    if (!user && !req.session.from) {
      res.redirect(`${process.env.FRONTEND_URL}/auth-fail`)
    }

    // 3) User is registering through invite
    if (!user && req.session.from) {
      // decrypt inviter
      var bytes = CryptoJS.AES.decrypt(req.session.from, 'Look, a smart ass!')
      var originalText = bytes.toString(CryptoJS.enc.Utf8)
      const inviterId = parseInt(originalText.substring(4))

      const getStreamToken = getStreamClient.createUserToken(profile.id)
      user = await prisma.user.create({
        data: {
          googleId: profile.id,
          fullname: profile.displayName,
          firstname: profile.name.familyName,
          givenname: profile.name.givenName,
          avatar: profile.photos[0].value,
          email: profile.emails[0].value,
          getStreamToken,
          inviter: {
            connect: {
              id: inviterId,
            },
          },
          following: { connect: { id: inviterId } },
        },
      })

      const userFeed = getStreamClient.feed('notifications', user.id)
      userFeed.follow('user', inviterId)
      userFeed.addActivity({
        actor: getStreamClient.user(inviterId),
        verb: 'follow',
        to: [`notifications:${user.id}`],
        object: `follow:${user.id}`,
        userId: user.id,
        inviterId,
      })

      const inviterFeed = getStreamClient.feed('notifications', inviterId)
      inviterFeed.follow('user', user.id)
      inviterFeed.addActivity({
        actor: getStreamClient.user(user.id),
        verb: 'follow',
        to: [`notifications:${inviterId}`],
        object: `follow:${inviterId}`,
        userId: user.id,
        inviterId,
      })

      var token = sign({ userId: user.id }, APP_SECRET)
      res.redirect(
        `${process.env.FRONTEND_URL}/?token=${token}&follow=${inviterId}`,
      )
    }

    var token = sign({ userId: user.id }, APP_SECRET)

    res.redirect(`${process.env.FRONTEND_URL}/?token=${token}`)
  },
)


server.start({
	port: 3000
}
)

module.exports = {
  User,
  Book,
  Chapter,
  Comment,
  Like,
  Review,
  Tag,
}

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

const stream = require('getstream')
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
  plugins: [
    nexusPrismaPlugin({
      experimentalCRUD: true,
    }),
  ],
  experimentalCRUD: true,
  outputs: {
    schema: __dirname + '/../schema.graphql',
  },
})

schema = applyMiddleware(schema, notifications)

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

server.express.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async function (req, res) {
    const { user: profile } = req

    const getStreamToken = getStreamClient.createUserToken(profile.id)
    const user = await prisma.user.upsert({
      where: {
        googleId: profile.id,
      },
      create: {
        googleId: profile.id,
        fullname: profile.displayName,
        firstname: profile.name.familyName,
        givenname: profile.name.givenName,
        avatar: profile.photos[0].value,
        email: profile.emails[0].value,
        getStreamToken,
      },
      update: {
        email: profile.emails[0].value,
        getStreamToken,
      },
    })
    var token = sign({ userId: user.id }, APP_SECRET)

    res.redirect(`${process.env.FRONTEND_URL}/?token=${token}`)
  },
)

server.start(() =>
  console.log(
    `🚀 Server ready at: http://localhost:4000\n⭐️ See sample queries: http://pris.ly/e/js/graphql#using-the-graphql-api`,
  ),
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

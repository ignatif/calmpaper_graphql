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
} = require('./graphql')
const { permissions } = require('./middlewares/permissions')
const { notifications } = require('./middlewares/notifications')
const express = require('express')
const multer = require('multer')
const multerS3 = require('multer-s3')
const cors = require('cors')
require('dotenv').config()

var passport = require('passport')
const { sign } = require('jsonwebtoken')
require('./passport/google')

const APP_SECRET = 'appsecret321'

const stream = require('getstream').default
const getStreamClient = stream.connect(
  'c2u3fw52wm4t',
  'grdr5z6ras7ugc33ezbqswq6k6pggrad4armpg3xjskpgp7gwttmqjgyfg86pn8z',
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
  ],
  plugins: [nexusPrismaPlugin()],
  experimentalCRUD: true,
  outputs: {
    schema: __dirname + '/../schema.graphql',
    // typegen: __dirname + '/generated/nexus.ts',
  },
})

// schema = applyMiddleware(schema, permissions, notifications)
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

// var Analytics = require('analytics-node');
// var analytics = new Analytics('aNRRikzxFRcUEi0MVQwIVE8SfWnuTdsR');

// Allowing passport to serialize and deserialize users into sessions
passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((obj, done) => done(null, obj))

server.express.use(express.static('public'))
server.express.use(session({ secret: 'cats' }))
server.express.use(bodyParser.urlencoded({ extended: false }))
server.express.use(passport.initialize())
server.express.use(passport.session())

// server.express.use(bodyParser.json());
server.express.use(cors())

server.express.use('/hi', (req, res) => {
  res.status(200).json({ ok: true })
})

// const aws = require('aws-sdk')
// aws.config.update({
//   accessKeyId: process.env.AWS_ACCESS_KEY,
//   secretAccessKey: process.env.AWS_SECRET,
//   region: 'us-east-1',
// })

// const s3 = new aws.S3({
//   /* ... */
// })
// const storage = multerS3({
//   s3: s3,
//   bucket: 'calmpaper-bucket',
//   acl: 'public-read',
//   metadata: function (req, file, cb) {
//     cb(null, { fieldName: file.fieldname })
//   },
//   filename(req, file, cb) {
//     cb(null, `${new Date()}-${file.originalname}`)
//   },
//   key: function (req, file, cb) {
//     cb(null, Date.now().toString())
//   },
// })

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
server.express.use(express.urlencoded({ extended: false }))

// auth

server.express.get(
  '/auth/google',
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
        fullname: profile.displayName,
        firstname: profile.name.familyName,
        givenname: profile.name.givenName,
        avatar: profile.photos[0].value,
        email: profile.emails[0].value,
        getStreamToken,
      },
    })
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

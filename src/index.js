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
  Notification,
  Tag,
  Genre,
} = require('./graphql')
const { permissions } = require('./permissions')
const express = require('express')
const multer = require('multer')
const cors = require('cors')
require('dotenv').config()

var passport = require('passport')
const { sign } = require('jsonwebtoken')
require('./passport/google')

const APP_SECRET = 'appsecret321'

var session = require('express-session'),
  bodyParser = require('body-parser')

const prisma = new PrismaClient()

const server = new GraphQLServer({
  schema: makeSchema({
    types: [
      Query,
      Mutation,
      User,
      Book,
      Chapter,
      Comment,
      Like,
      Review,
      Notification,
      Tag,
      Genre,
    ],
    plugins: [nexusPrismaPlugin()],
    middlewares: [permissions],
    experimentalCRUD: true,
    outputs: {
      schema: __dirname + '/../schema.graphql',
      // typegen: __dirname + '/generated/nexus.ts',
    },
  }),
  context: (request) => {
    return {
      ...request,
      prisma,
    }
  },
})

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
    scope: ['https://www.googleapis.com/auth/plus.login'],
  }),
)

server.express.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    var token = sign({ userId: req.user.id }, APP_SECRET)

    res.redirect(`http://localhost:3000?token=${token}`)
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
  Notification,
  Tag,
}

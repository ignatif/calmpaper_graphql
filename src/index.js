const { GraphQLServer } = require('graphql-yoga')
const { makeSchema, objectType, intArg, stringArg } = require('@nexus/schema')
const { PrismaClient } = require('@prisma/client')
const { nexusPrismaPlugin } = require('nexus-prisma')
const { User, Book, Chapter, Voice, Rating } = require('./types')
const express = require('express')
const multer = require('multer')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const passport = require('passport')
const MagicStrategy = require('passport-magic').Strategy
const { Magic } = require('@magic-sdk/admin')
require('dotenv').config()

const prisma = new PrismaClient()

const Query = objectType({
  name: 'Query',
  definition(t) {
    t.crud.user()
    t.crud.users()
    t.crud.book()
    t.crud.books()
    t.crud.chapter()
    t.crud.chapters()
    t.crud.voice()
    t.crud.voices()
    t.crud.rating()
    t.crud.ratings()
  },
})

const Mutation = objectType({
  name: 'Mutation',
  definition(t) {
    t.crud.createOneUser()
    t.crud.updateOneUser()
    t.crud.deleteOneUser()

    t.crud.createOneBook()
    t.crud.updateOneBook()
    t.crud.deleteOneBook()

    t.crud.createOneChapter()
    t.crud.updateOneChapter()
    t.crud.deleteOneChapter()

    t.crud.createOneVoice()
    t.crud.updateOneVoice()
    t.crud.deleteOneVoice()

    t.crud.createOneRating()
    t.crud.updateOneRating()
    t.crud.deleteOneRating()
  },
})

const server = new GraphQLServer({
  schema: makeSchema({
    types: [Query, Mutation, User, Book, Chapter, Voice, Rating],
    plugins: [nexusPrismaPlugin()],
    // experimentalCRUD: true,
    outputs: {
      schema: __dirname + '/../schema.graphql',
      typegen: __dirname + '/generated/nexus.ts',
    },
  }),
  context: { prisma },
})

// server.express.use(bodyParser.json());
server.express.use(cors())

server.express.use('/hi', (req, res) => {
  res.status(200).json({ ok: true })
})

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
server.express.use(cookieParser())
server.express.use(
  session({
    secret: "not my cat's name",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 60 * 60 * 1000, // 1 hour
      // secure: true, // Uncomment this line to enforce HTTPS protocol.
      sameSite: true,
    },
  }),
)
server.express.use(passport.initialize())
server.express.use(passport.session())

// ____________________________________________________________________________

const magic = new Magic(process.env.MAGIC_SECRET_KEY)

/* 2️⃣ Implement Auth Strategy */

const strategy = new MagicStrategy(async function (user, done) {
  console.log('user')
  console.log(user)
  const userMetadata = await magic.users.getMetadataByIssuer(user.issuer)
  const existingUser = await prisma.user.findOne({ issuer: user.issuer })
  if (!existingUser) {
    /* Create new user if doesn't exist */
    // return signup(user, userMetadata, done)
  } else {
    /* Login user if otherwise */
    // return login(user, done)
  }
})

passport.use(strategy)

const signup = async (user, userMetadata, done) => {
  let newUser = {
    issuer: user.issuer,
    email: userMetadata.email,
    lastLoginAt: user.claim.iat,
  }
  await users.insert(newUser)
  return done(null, newUser)
}

/* Implement User Login */
const login = async (user, done) => {
  /* Replay attack protection (https://go.magic.link/replay-attack) */
  if (user.claim.iat <= user.lastLoginAt) {
    return done(null, false, {
      message: `Replay attack detected for user ${user.issuer}}.`,
    })
  }
  await users.update(
    { issuer: user.issuer },
    { $set: { lastLoginAt: user.claim.iat } },
  )
  return done(null, user)
}

/* Attach middleware to login endpoint */
server.express.post('/login', passport.authenticate('magic'), (req, res) => {
  if (req.user) {
    res.status(200).end('User is logged in.')
  } else {
    return res.status(401).end('Could not log user in.')
  }
})

/* 4️⃣ Implement Session Behavior */

/* Defines what data are stored in the user session */
passport.serializeUser((user, done) => {
  done(null, user.issuer)
})

/* Populates user data in the req.user object */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await users.findOne({ issuer: id })
    done(null, user)
  } catch (err) {
    done(err, null)
  }
})

/* 5️⃣ Implement User Endpoints */

/* Implement Get Data Endpoint */
server.express.get('/security-check', async (req, res) => {
  if (req.isAuthenticated()) {
    return res.status(200).json(req.user).end()
  } else {
    return res.status(401).end(`User is not logged in.`)
  }
})

/* Implement Buy Apple Endpoint */
server.express.post('/buy-apple', async (req, res) => {
  if (req.isAuthenticated()) {
    await users.update({ issuer: req.user.issuer }, { $inc: { appleCount: 1 } })
    return res.status(200).end()
  } else {
    return res.status(401).end(`User is not logged in.`)
  }
})

/* Implement Logout Endpoint */
server.express.post('/logout', async (req, res) => {
  if (req.isAuthenticated()) {
    await magic.users.logoutByIssuer(req.user.issuer)
    req.logout()
    return res.status(200).end()
  } else {
    return res.status(401).end(`User is not logged in.`)
  }
})

server.start(() =>
  console.log(
    `🚀 Server ready at: http://localhost:4000\n⭐️ See sample queries: http://pris.ly/e/js/graphql#using-the-graphql-api`,
  ),
)

module.exports = {
  User,
  Book,
  Chapter,
  Voice,
  Rating,
}

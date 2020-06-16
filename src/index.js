const { GraphQLServer } = require('graphql-yoga')
const { makeSchema, objectType, intArg, stringArg } = require('@nexus/schema')
const { PrismaClient } = require('@prisma/client')
const { nexusPrismaPlugin } = require('nexus-prisma')
const { User, Book, Chapter, Voice, Rating } = require('./types')
const express = require('express')
const multer = require('multer')
const cors = require('cors')

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

const prisma = new PrismaClient()

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

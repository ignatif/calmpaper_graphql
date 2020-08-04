const { ApolloServer } = require('apollo-server-micro')
const { PrismaClient } = require('@prisma/client')
const { nexusPrismaPlugin } = require('nexus-prisma')
const { makeSchema } = require('@nexus/schema')
const { applyMiddleware } = require('graphql-middleware')

const types = require('./graphql')
const { permissions } = require('./middlewares/permissions')
const { notifications } = require('./middlewares/notifications')
require('dotenv').config()

const prisma = new PrismaClient()

let schema = makeSchema({
  types,
  plugins: [nexusPrismaPlugin()],
  experimentalCRUD: true,
  outputs: {
    schema: __dirname + '/../schema.graphql',
  },
})

schema = applyMiddleware(schema, permissions, notifications)

const server = new ApolloServer({
  schema,
  context: (request) => {
    return {
      ...request,
      prisma,
    }
  },
})

module.exports = server.createHandler()

const { GraphQLServerLambda } = require('graphql-yoga')
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
require('dotenv').config()

const prisma = new PrismaClient()

const { ApolloServer } = require('apollo-server-micro')

const server = new ApolloServer({
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
    },
  }),
  context: (request) => {
    return {
      ...request,
      prisma,
    }
  },
  playground: true,
  introspection: true,
})

console.log(server)

module.exports = server.createHandler({ path: '/api' })

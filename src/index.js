const { ApolloServer } = require('apollo-server-micro')
const { PrismaClient } = require('@prisma/client')
const { nexusPrismaPlugin } = require('nexus-prisma')
const { makeSchema } = require('@nexus/schema')
const { applyMiddleware } = require('graphql-middleware')

const types = require('./graphql')
const { permissions } = require('./middlewares/permissions')
const { notifications } = require('./middlewares/notifications')
require('dotenv').config()

const { S3 } = require('aws-sdk')
const { upload } = require('graphql-middleware-apollo-upload-server')

const client = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
  params: { Bucket: process.env.AWS_S3_BUCKET },
})

const uploadToS3 = async (file) => {
  console.log('file')
  console.log(file)
  const { stream, filename, mimetype, encoding } = file

  const response = await client
    .upload({
      Key: filename,
      ACL: 'public-read',
      Body: file.stream,
    })
    .promise()

  return {
    name: filename,
    url: response.Location,
  }
}

const prisma = new PrismaClient()

let schema = makeSchema({
  types,
  plugins: [nexusPrismaPlugin()],
  experimentalCRUD: true,
  outputs: {
    schema: __dirname + '/../schema.graphql',
  },
})

schema = applyMiddleware(
  schema,
  permissions,
  notifications,
  upload({ uploadHandler: uploadToS3 }),
)

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

import { createYoga } from 'graphql-yoga'
import { readUserId } from './auth.js'
import { config } from './config.js'
import { prisma } from './prisma.js'
import { schema } from './schema.js'

export function createCalmpaperYoga(graphqlEndpoint = '/graphql') {
  return createYoga({
    schema,
    graphqlEndpoint,
    graphiql: !config.production,
    cors: {
      origin: [config.frontendUrl, 'http://localhost:3000'],
      credentials: false,
      allowedHeaders: ['content-type', 'authorization'],
      methods: ['POST', 'GET', 'OPTIONS'],
    },
    context: ({ request }) => ({
      prisma,
      userId: readUserId(request),
    }),
    maskedErrors: config.production,
  })
}

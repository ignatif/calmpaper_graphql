import { createServer } from 'node:http'
import { createCalmpaperYoga } from './app.js'
import { config } from './config.js'

const yoga = createCalmpaperYoga('/graphql')
const server = createServer(yoga)

server.listen(config.port, () => {
  console.log(`Calmpaper GraphQL API is running on http://localhost:${config.port}/graphql`)
})

export default function handler(_request, response) {
  response.status(200).json({
    name: 'Calmpaper GraphQL API',
    graphql: '/api/graphql',
    health: '/api/health',
  })
}

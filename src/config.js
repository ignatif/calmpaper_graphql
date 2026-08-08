import 'dotenv/config'

const production = process.env.NODE_ENV === 'production'

export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.APP_SECRET || (production ? '' : 'local-calmpaper-secret'),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  production,
}

if (!config.jwtSecret) {
  throw new Error('APP_SECRET is required in production')
}

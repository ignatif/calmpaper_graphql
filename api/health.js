import { prisma } from '../src/prisma.js'

export default async function handler(_request, response) {
  try {
    await prisma.$queryRaw`SELECT 1`
    response.status(200).json({ ok: true, database: 'connected' })
  } catch {
    response.status(503).json({ ok: false, database: 'unavailable' })
  }
}

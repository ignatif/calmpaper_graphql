import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from './config.js'

export const hashPassword = (password) => bcrypt.hash(password, 12)

export const verifyPassword = (password, passwordHash) =>
  bcrypt.compare(password, passwordHash)

export const createToken = (userId) =>
  jwt.sign({ userId }, config.jwtSecret, { expiresIn: '30d' })

export const readUserId = (request) => {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null

  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret)
    return typeof payload === 'object' && typeof payload.userId === 'string'
      ? payload.userId
      : null
  } catch {
    return null
  }
}

export const requireUser = (context) => {
  if (!context.userId) {
    throw new Error('You need to sign in first')
  }
  return context.userId
}

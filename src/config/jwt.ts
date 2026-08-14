/**
 * JWT工具函数
 */

import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import type { UserPayload } from '../types'

dotenv.config()

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET 环境变量未配置，请在 .env 中设置')
  }
  return secret
}

const JWT_SECRET = getJwtSecret()

export const signToken = (payload: { userId: string; role: string; jti: string }): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export const verifyToken = (token: string): UserPayload => {
  return jwt.verify(token, JWT_SECRET) as UserPayload
}

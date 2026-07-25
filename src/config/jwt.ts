/**
 * JWT工具函数
 * 
 * 作用：生成和验证JWT Token，用于用户认证
 * 
 * 使用方式：
 *   import { signToken, verifyToken } from '../config/jwt'
 *   const token = signToken({ userId: 1, role: 'fan', jti: 'uuid' })
 *   const payload = verifyToken(token)
 */

import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export const signToken = (payload: { userId: number; role: string; jti: string }): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET)
}
/**
 * 认证服务
 * 
 * 作用：实现认证相关业务逻辑（验证码/注册/登录/登出/获取用户信息）
 *       与数据库交互、调用工具函数、处理业务规则
 */

import { prisma } from '../lib/prisma'
import redis from '../config/redis'
import { signToken } from '../config/jwt'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import svgCaptcha from 'svg-captcha'
import crypto from 'crypto'
import AppError from '../utils/appError'

export const getCaptcha = async () => {
  const captcha = svgCaptcha.create({
    size: 4,
    ignoreChars: '0oO1ilI',
    noise: 2,
    width: 120,
    height: 40
  })

  const captchaId = crypto.randomUUID()
  await redis.set(`captcha:${captchaId}`, captcha.text.toLowerCase(), 'EX', 300)

  return {
    svg: captcha.data,
    captchaId
  }
}

export const register = async ({ username, password, captchaId, captchaText }: {
  username: string
  password: string
  captchaId: string
  captchaText: string
}) => {
  const storedCaptcha = await redis.get(`captcha:${captchaId}`)
  if (!storedCaptcha || storedCaptcha !== captchaText.toLowerCase()) {
    throw new AppError('验证码错误', 400)
  }

  await redis.del(`captcha:${captchaId}`)

  const existingUser = await prisma.users.findUnique({ where: { username } })
  if (existingUser) {
    throw new AppError('用户名已存在', 409)
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.users.create({
    data: {
      username,
      password_hash: passwordHash,
      nickname: username,
      role: 'fan',
      status: 'active'
    },
    select: { id: true }
  })

  return { userId: user.id }
}

export const login = async ({ username, password }: {
  username: string
  password: string
}) => {
  const user = await prisma.users.findUnique({ where: { username } })
  if (!user) {
    throw new AppError('用户名或密码错误', 400)
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash)
  if (!isPasswordValid) {
    throw new AppError('用户名或密码错误', 400)
  }

  if (user.status === 'banned') {
    throw new AppError('账号已被封禁，请联系管理员', 403)
  }

  const jti = crypto.randomUUID()
  const token = signToken({ userId: user.id, role: user.role, jti })

  await prisma.users.update({
    where: { id: user.id },
    data: { updated_at: new Date() }
  })

  const avatar = user.avatar_id ? await prisma.avatars.findUnique({ where: { id: user.avatar_id } }) : null

  return {
    token,
    expiresIn: 604800,
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: avatar?.url || '',
      role: user.role
    }
  }
}

export const logout = async (userId: number, token: string) => {
  try {
    const decoded = jwt.decode(token) as any
    if (decoded && decoded.jti) {
      const expiresAt = decoded.exp * 1000
      const ttl = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      await redis.set(`jwt_blacklist:${decoded.jti}`, '1', 'EX', ttl)
    }
  } catch (err) {
    console.error('登出失败:', err)
  }
}

export const getMe = async (userId: number) => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: { avatars: true }
  })

  if (!user) {
    throw new AppError('用户不存在', 404)
  }

  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    avatar: user.avatars?.url || '',
    avatarId: user.avatar_id || null,
    role: user.role,
    createdAt: user.created_at
  }
}

export default {
  getCaptcha,
  register,
  login,
  logout,
  getMe
}
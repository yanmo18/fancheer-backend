/**
 * 认证服务
 */

import { prisma } from '../lib/prisma'
import redis from '../config/redis'
import { signToken } from '../config/jwt'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import svgCaptcha from 'svg-captcha'
import crypto from 'crypto'
import AppError from '../utils/appError'
import { EXPIRY_TIME, REDIS_KEYS } from '../config/constants'

export const getCaptcha = async () => {
  const captcha = svgCaptcha.create({
    size: 4,
    ignoreChars: '0oO1ilI',
    noise: 2,
    width: 120,
    height: 40
  })

  const captchaId = crypto.randomUUID()
  await redis.set(REDIS_KEYS.captcha(captchaId), captcha.text.toLowerCase(), 'EX', EXPIRY_TIME.CAPTCHA_EXPIRES)

  return {
    svg: captcha.data,
    captchaId
  }
}

export const register = async ({ username, password, captchaId, captchaText, avatarId }: {
  username: string
  password: string
  captchaId: string
  captchaText: string
  avatarId?: bigint
}) => {
  const storedCaptcha = await redis.get(REDIS_KEYS.captcha(captchaId))
  if (!storedCaptcha || storedCaptcha !== captchaText.toLowerCase()) {
    throw new AppError('验证码错误', 400)
  }

  await redis.del(REDIS_KEYS.captcha(captchaId))

  const existingUser = await prisma.users.findUnique({ where: { username } })
  if (existingUser) {
    throw new AppError('用户名已存在', 409)
  }

  if (avatarId) {
    const avatar = await prisma.avatars.findUnique({ where: { id: avatarId } })
    if (!avatar) {
      throw new AppError('头像不存在', 404)
    }
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.users.create({
    data: {
      username,
      password_hash: passwordHash,
      nickname: username,
      role: 'fan',
      status: 'active',
      avatar_id: avatarId ?? null
    },
    select: { id: true }
  })

  return { userId: user.id }
}

export const getRegisterAvatars = async () => {
  return prisma.avatars.findMany({
    orderBy: { sort_order: 'desc' },
    select: { id: true, url: true }
  })
}

export const login = async ({ username, password }: {
  username: string
  password: string
}) => {
  const loginKey = REDIS_KEYS.loginRateLimit(username)
  const locked = await redis.get(loginKey)
  if (locked) {
    throw new AppError('登录尝试过于频繁，请60秒后再试', 429)
  }

  const user = await prisma.users.findUnique({ where: { username } })
  if (!user) {
    await redis.set(loginKey, '1', 'EX', EXPIRY_TIME.LOGIN_COOLDOWN)
    throw new AppError('用户名或密码错误', 400)
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash)
  if (!isPasswordValid) {
    await redis.set(loginKey, '1', 'EX', EXPIRY_TIME.LOGIN_COOLDOWN)
    throw new AppError('用户名或密码错误', 400)
  }

  if (user.status === 'banned') {
    throw new AppError('账号已被封禁，请联系管理员', 403)
  }

  const jti = crypto.randomUUID()
  const token = signToken({ userId: user.id.toString(), role: user.role, jti })

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

export const logout = async (token: string) => {
  try {
    const decoded = jwt.decode(token) as { jti?: string; exp?: number } | null
    if (decoded?.jti && decoded.exp) {
      const ttl = Math.max(0, Math.floor(decoded.exp - Date.now() / 1000))
      await redis.set(REDIS_KEYS.jwtBlacklist(decoded.jti), '1', 'EX', ttl)
    }
  } catch (err) {
    console.error('登出失败:', err)
  }
}

export const getMe = async (userId: bigint) => {
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
  getRegisterAvatars,
  register,
  login,
  logout,
  getMe
}

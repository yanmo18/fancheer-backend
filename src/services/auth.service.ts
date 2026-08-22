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

export const getCaptcha = async (clientIp: string) => {
  const captchaKey = REDIS_KEYS.captchaRateLimit(clientIp)
  if (await redis.get(captchaKey)) {
    throw new AppError('验证码请求过于频繁，请稍后再试', 429)
  }

  const captcha = svgCaptcha.create({
    size: 4,
    ignoreChars: '0oO1ilI',
    noise: 2,
    width: 120,
    height: 40
  })

  const captchaId = crypto.randomUUID()
  await redis.set(REDIS_KEYS.captcha(captchaId), captcha.text.toLowerCase(), 'EX', EXPIRY_TIME.CAPTCHA_EXPIRES)
  await redis.set(captchaKey, '1', 'EX', EXPIRY_TIME.CAPTCHA_COOLDOWN)

  return {
    svg: captcha.data,
    captchaId
  }
}

export const register = async ({ username, password, captchaId, captchaText, avatarId, clientIp }: {
  username: string
  password: string
  captchaId: string
  captchaText: string
  avatarId?: bigint
  clientIp: string
}) => {
  const registerKey = REDIS_KEYS.registerRateLimit(clientIp)
  if (await redis.get(registerKey)) {
    throw new AppError('注册过于频繁，请60秒后再试', 429)
  }

  try {
    if (!captchaId || !captchaText?.trim()) {
      throw new AppError('请填写验证码', 400)
    }

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
  } finally {
    await redis.set(registerKey, '1', 'EX', EXPIRY_TIME.REGISTER_COOLDOWN)
  }
}

export const getRegisterAvatars = async () => {
  const avatars = await prisma.avatars.findMany({
    orderBy: { sort_order: 'desc' },
    select: { id: true, url: true }
  })

  return avatars.map((avatar) => ({
    id: avatar.id.toString(),
    url: avatar.url
  }))
}

export const login = async ({ username, password, clientIp }: {
  username: string
  password: string
  clientIp: string
}) => {
  const loginKey = REDIS_KEYS.loginRateLimit(username)
  const loginIpKey = REDIS_KEYS.loginIpRateLimit(clientIp)
  if (await redis.get(loginKey) || await redis.get(loginIpKey)) {
    throw new AppError('登录尝试过于频繁，请60秒后再试', 429)
  }

  const markLoginFailed = async () => {
    await redis.set(loginKey, '1', 'EX', EXPIRY_TIME.LOGIN_COOLDOWN)
    await redis.set(loginIpKey, '1', 'EX', EXPIRY_TIME.LOGIN_COOLDOWN)
  }

  const user = await prisma.users.findUnique({ where: { username } })
  if (!user) {
    await markLoginFailed()
    throw new AppError('用户名或密码错误', 400)
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash)
  if (!isPasswordValid) {
    await markLoginFailed()
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
      id: user.id.toString(),
      username: user.username,
      nickname: user.nickname,
      avatar: avatar?.url || '',
      avatarId: user.avatar_id ? user.avatar_id.toString() : null,
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
    id: user.id.toString(),
    username: user.username,
    nickname: user.nickname,
    avatar: user.avatars?.url || '',
    avatarId: user.avatar_id ? user.avatar_id.toString() : null,
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

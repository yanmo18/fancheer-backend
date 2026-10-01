/**
 * 用户服务
 */

import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import redis from '../config/redis'
import AppError from '../utils/appError'
import { EXPIRY_TIME, REDIS_KEYS } from '../config/constants'

export const updateNickname = async (userId: bigint, nickname: string) => {
  const user = await prisma.users.update({
    where: { id: userId },
    data: { nickname, updated_at: new Date() },
    select: { nickname: true }
  })

  return user
}

export const updateAvatar = async (userId: bigint, avatarId: bigint) => {
  const avatar = await prisma.avatars.findUnique({ where: { id: avatarId } })
  if (!avatar) {
    throw new AppError('头像不存在', 404)
  }

  await prisma.users.update({
    where: { id: userId },
    data: { avatar_id: avatarId, updated_at: new Date() }
  })

  return { avatar: avatar.url }
}

export const changePassword = async (
  userId: bigint,
  currentPassword: string,
  newPassword: string,
) => {
  const rateKey = REDIS_KEYS.passwordChangeRateLimit(userId)
  if (await redis.get(rateKey)) {
    throw new AppError('修改密码过于频繁，请60秒后再试', 429)
  }

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { id: true, password_hash: true },
  })
  if (!user) {
    throw new AppError('用户不存在', 404)
  }

  const matched = await bcrypt.compare(currentPassword, user.password_hash)
  if (!matched) {
    await redis.set(rateKey, '1', 'EX', EXPIRY_TIME.PASSWORD_CHANGE_COOLDOWN)
    throw new AppError('当前密码错误', 400)
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.users.update({
    where: { id: userId },
    data: { password_hash: passwordHash, updated_at: new Date() },
  })
  await redis.set(rateKey, '1', 'EX', EXPIRY_TIME.PASSWORD_CHANGE_COOLDOWN)

  return null
}

export const getAvatars = async () => {
  const avatars = await prisma.avatars.findMany({
    orderBy: { sort_order: 'desc' },
    select: { id: true, url: true }
  })

  return avatars.map((avatar) => ({
    id: avatar.id.toString(),
    url: avatar.url
  }))
}

export default {
  updateNickname,
  updateAvatar,
  changePassword,
  getAvatars
}

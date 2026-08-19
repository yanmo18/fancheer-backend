/**
 * 用户服务
 */

import { prisma } from '../lib/prisma'
import AppError from '../utils/appError'

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
  getAvatars
}

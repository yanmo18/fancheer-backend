/**
 * 用户服务
 * 
 * 作用：实现用户相关业务逻辑（修改昵称/修改头像/获取头像池）
 *       与数据库交互、调用工具函数、处理业务规则
 */

import { prisma } from '../lib/prisma'
import AppError from '../utils/appError'

export const updateNickname = async (userId: number, nickname: string) => {
  const user = await prisma.users.update({
    where: { id: userId },
    data: { nickname, updated_at: new Date() },
    select: { nickname: true }
  })

  return user
}

export const updateAvatar = async (userId: number, avatarId: number) => {
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

  return avatars
}

export default {
  updateNickname,
  updateAvatar,
  getAvatars
}
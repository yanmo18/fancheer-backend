/**
 * 用户服务
 * 
 * 作用：实现用户相关业务逻辑（修改昵称/修改头像/获取头像池）
 *       与数据库交互、调用工具函数、处理业务规则
 */

import { prisma } from '../lib/prisma'
import AppError from '../utils/appError'

export const updateNickname = async (userId: number, nickname: string) => {
  const sensitiveWords = await prisma.sensitive_words.findMany()
  for (const word of sensitiveWords) {
    if (nickname.includes(word.word)) {
      throw new AppError('昵称包含敏感词，请修改', 400)
    }
  }

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

export const getPrivateReplies = async (userId: number, page: number, pageSize: number) => {
  const skip = (page - 1) * pageSize

  const [list, total] = await Promise.all([
    prisma.private_replies.findMany({
      where: { target_user_id: userId },
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' },
      include: {
        messages: { select: { id: true, content: true } },
        users_private_replies_streamer_idTousers: { select: { id: true, nickname: true } }
      }
    }),
    prisma.private_replies.count({ where: { target_user_id: userId } })
  ])

  return {
    list: list.map(reply => ({
      id: reply.id,
      messageId: reply.message_id,
      originalMessageContent: reply.messages?.content || '',
      content: reply.content,
      streamerNickname: reply.users_private_replies_streamer_idTousers?.nickname || '',
      createdAt: reply.created_at
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}

export default {
  updateNickname,
  updateAvatar,
  getAvatars,
  getPrivateReplies
}
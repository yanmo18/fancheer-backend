/**
 * 聊天室服务
 * 
 * 作用：实现聊天室相关业务逻辑（发送消息/获取消息/点赞/私密消息）
 *       与数据库交互、调用工具函数、处理业务规则（限流、点赞幂等、私密消息隔离）
 */

import { prisma } from '../lib/prisma'
import { redis } from '../config/redis'
import AppError from '../utils/appError'

export const getMessages = async (page: number, pageSize: number) => {
  const skip = (page - 1) * pageSize
  const [list, total] = await Promise.all([
    prisma.messages.findMany({
      where: { type: 'public' },
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' },
      include: {
        users: { select: { id: true, nickname: true, avatar_id: true } },
        _count: { select: { likes: true } }
      }
    }),
    prisma.messages.count({ where: { type: 'public' } })
  ])

  return {
    list: list.map(msg => ({
      id: msg.id,
      content: msg.content,
      type: msg.type,
      createdAt: msg.created_at,
      user: {
        id: msg.users.id,
        nickname: msg.users.nickname,
        avatarId: msg.users.avatar_id
      },
      likeCount: msg._count.likes
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}

export const sendMessage = async (userId: number, content: string) => {
  const lastMessage = await redis.get(`rate_limit:msg:${userId}`)
  if (lastMessage) {
    throw new AppError('消息发送过于频繁，请稍后再试', 429)
  }

  await redis.set(`rate_limit:msg:${userId}`, '1', 'EX', 20)

  const message = await prisma.messages.create({
    data: {
      user_id: userId,
      content,
      type: 'public'
    },
    select: { id: true, content: true, created_at: true }
  })

  return {
    id: message.id,
    content: message.content,
    createdAt: message.created_at
  }
}

export const sendPrivateMessage = async (userId: number, content: string) => {
  const lastMessage = await redis.get(`rate_limit:msg:${userId}`)
  if (lastMessage) {
    throw new AppError('消息发送过于频繁，请稍后再试', 429)
  }

  await redis.set(`rate_limit:msg:${userId}`, '1', 'EX', 20)

  const message = await prisma.messages.create({
    data: {
      user_id: userId,
      content,
      type: 'private'
    },
    select: { id: true, content: true, created_at: true }
  })

  return {
    id: message.id,
    content: message.content,
    createdAt: message.created_at
  }
}

export const likeMessage = async (userId: number, messageId: number) => {
  const idempotencyKey = `like:${userId}:${messageId}`
  const existing = await redis.get(idempotencyKey)
  if (existing) {
    throw new AppError('操作过于频繁', 429)
  }

  await redis.set(idempotencyKey, '1', 'EX', 1)

  const message = await prisma.messages.findUnique({ where: { id: messageId } })
  if (!message) {
    throw new AppError('消息不存在', 404)
  }

  const existingLike = await prisma.likes.findUnique({
    where: { user_id_message_id: { user_id: userId, message_id: messageId } }
  })

  if (existingLike) {
    await prisma.likes.delete({ where: { id: existingLike.id } })
    return { liked: false }
  } else {
    await prisma.likes.create({
      data: { user_id: userId, message_id: messageId }
    })
    return { liked: true }
  }
}

export const getPrivateMessages = async (userId: number, userRole: string, page: number, pageSize: number) => {
  const skip = (page - 1) * pageSize
  
  let whereClause: any = { type: 'private' }
  
  if (userRole !== 'streamer') {
    whereClause.user_id = userId
  }

  const [list, total] = await Promise.all([
    prisma.messages.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' },
      include: {
        users: { select: { id: true, nickname: true, avatar_id: true } },
        private_replies: true
      }
    }),
    prisma.messages.count({ where: whereClause })
  ])

  return {
    list: list.map(msg => ({
      id: msg.id,
      content: msg.content,
      type: msg.type,
      createdAt: msg.created_at,
      user: {
        id: msg.users.id,
        nickname: msg.users.nickname,
        avatarId: msg.users.avatar_id
      },
      replies: msg.private_replies.map(reply => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.created_at
      }))
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
  getMessages,
  sendMessage,
  sendPrivateMessage,
  likeMessage,
  getPrivateMessages
}
/**
 * 聊天室服务
 * 
 * 作用：实现聊天室相关业务逻辑（发送消息/获取消息/点赞/私密消息/举报/回复）
 *       与数据库交互、调用工具函数、处理业务规则（限流、点赞幂等、私密消息隔离）
 */

import { prisma } from '../lib/prisma'
import redis from '../config/redis'
import AppError from '../utils/appError'

export const getPublicMessages = async (before?: string, limit: number = 20, userId?: number, userRole?: string) => {
  const whereClause: any = { type: 'public' }
  
  if (before) {
    whereClause.created_at = { lt: new Date(before) }
  }

  const messages = await prisma.messages.findMany({
    where: whereClause,
    take: Math.min(limit, 20),
    orderBy: { created_at: 'desc' },
    include: {
      users: { select: { id: true, nickname: true, avatar_id: true, avatars: true } },
      _count: { select: { likes: true } }
    }
  })

  let likedMessageIds: bigint[] = []
  if (userId) {
    const likes = await prisma.likes.findMany({
      where: { user_id: userId, message_id: { in: messages.map(m => m.id) } },
      select: { message_id: true }
    })
    likedMessageIds = likes.map(l => l.message_id)
  }

  return messages.map(msg => ({
    id: Number(msg.id),
    senderId: Number(msg.users.id),
    senderNickname: msg.users.nickname || '',
    senderAvatar: msg.users.avatars?.url || '',
    content: msg.content,
    type: msg.type,
    likeCount: msg._count.likes,
    isLiked: likedMessageIds.includes(msg.id),
    createdAt: msg.created_at
  }))
}

export const sendMessage = async (userId: number, content: string, type: string = 'public') => {
  const lastMessage = await redis.get(`rate_limit:msg:${userId}`)
  if (lastMessage) {
    throw new AppError('发送过于频繁，请20秒后再试', 429)
  }

  await redis.set(`rate_limit:msg:${userId}`, '1', 'EX', 20)

  const message = await prisma.messages.create({
    data: {
      sender_id: userId,
      content,
      type: type as 'public' | 'private'
    },
    select: { id: true, content: true, type: true, created_at: true, like_count: true }
  })

  return {
    id: message.id,
    content: message.content,
    type: message.type,
    likeCount: message.like_count,
    createdAt: message.created_at
  }
}

export const likeMessage = async (userId: number, messageId: number) => {
  const idempotencyKey = `like:${userId}:${messageId}`
  const existing = await redis.get(idempotencyKey)
  if (existing) {
    const message = await prisma.messages.findUnique({ where: { id: messageId } })
    return { likeCount: message?.like_count || 0 }
  }

  await redis.set(idempotencyKey, '1', 'EX', 1)

  const message = await prisma.messages.findUnique({ where: { id: messageId } })
  if (!message) {
    throw new AppError('消息不存在', 404)
  }

  if (message.type !== 'public') {
    throw new AppError('仅公开消息可点赞', 400)
  }

  const existingLike = await prisma.likes.findUnique({
    where: { user_id_message_id: { user_id: userId, message_id: messageId } }
  })

  if (existingLike) {
    throw new AppError('已点赞过', 409)
  }

  await prisma.likes.create({
    data: { user_id: userId, message_id: messageId }
  })

  const updatedMessage = await prisma.messages.update({
    where: { id: messageId },
    data: { like_count: { increment: 1 } },
    select: { like_count: true }
  })

  return { likeCount: updatedMessage.like_count }
}

export const unlikeMessage = async (userId: number, messageId: number) => {
  const idempotencyKey = `like:${userId}:${messageId}`
  const existing = await redis.get(idempotencyKey)
  if (existing) {
    const message = await prisma.messages.findUnique({ where: { id: messageId } })
    return { likeCount: message?.like_count || 0 }
  }

  await redis.set(idempotencyKey, '1', 'EX', 1)

  const message = await prisma.messages.findUnique({ where: { id: messageId } })
  if (!message) {
    throw new AppError('消息不存在', 404)
  }

  if (message.type !== 'public') {
    throw new AppError('仅公开消息可取消点赞', 400)
  }

  const existingLike = await prisma.likes.findUnique({
    where: { user_id_message_id: { user_id: userId, message_id: messageId } }
  })

  if (!existingLike) {
    throw new AppError('未点赞', 404)
  }

  await prisma.likes.delete({
    where: { user_id_message_id: { user_id: userId, message_id: messageId } }
  })

  const updatedMessage = await prisma.messages.update({
    where: { id: messageId },
    data: { like_count: { decrement: 1 } },
    select: { like_count: true }
  })

  return { likeCount: updatedMessage.like_count }
}

export const getPrivateMessages = async (userId: number, page: number, pageSize: number) => {
  const skip = (page - 1) * pageSize

  const [list, total] = await Promise.all([
    prisma.messages.findMany({
      where: { type: 'private', sender_id: userId },
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        sender_id: true,
        content: true,
        type: true,
        like_count: true,
        created_at: true
      }
    }),
    prisma.messages.count({ where: { type: 'private', sender_id: userId } })
  ])

  return {
    list: list.map(msg => ({
      id: msg.id,
      senderId: msg.sender_id,
      content: msg.content,
      type: msg.type,
      likeCount: msg.like_count,
      createdAt: msg.created_at
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}

export const reportMessage = async (userId: number, messageId: number, reason: string) => {
  const message = await prisma.messages.findUnique({ where: { id: messageId } })
  if (!message) {
    throw new AppError('消息不存在', 404)
  }

  if (Number(message.sender_id) === userId) {
    throw new AppError('不能举报自己的消息', 400)
  }

  const existingReport = await prisma.reports.findFirst({
    where: { reporter_id: userId, message_id: messageId }
  })

  if (existingReport) {
    throw new AppError('您已经举报过这条消息了', 409)
  }

  const report = await prisma.reports.create({
    data: {
      reporter_id: userId,
      message_id: messageId,
      reason,
      status: 'pending'
    },
    select: { id: true }
  })

  return { reportId: report.id }
}

export const streamerReply = async (userId: number, messageId: number, content: string, replyType: string = 'public') => {
  const lastMessage = await redis.get(`rate_limit:msg:${userId}`)
  if (lastMessage) {
    throw new AppError('发送过于频繁，请20秒后再试', 429)
  }

  await redis.set(`rate_limit:msg:${userId}`, '1', 'EX', 20)

  const message = await prisma.messages.findUnique({ where: { id: messageId } })
  if (!message) {
    throw new AppError('消息不存在', 404)
  }

  const replyMessage = await prisma.messages.create({
    data: {
      sender_id: userId,
      content,
      type: replyType === 'private' ? 'private' : 'public'
    },
    select: { id: true, content: true, type: true, created_at: true }
  })

  return {
    id: replyMessage.id,
    messageId,
    streamerId: userId,
    targetUserId: message.sender_id,
    content: replyMessage.content,
    replyType,
    createdAt: replyMessage.created_at
  }
}

export const privateReply = async (userId: number, messageId: number, content: string) => {
  const lastMessage = await redis.get(`rate_limit:msg:${userId}`)
  if (lastMessage) {
    throw new AppError('发送过于频繁，请20秒后再试', 429)
  }

  await redis.set(`rate_limit:msg:${userId}`, '1', 'EX', 20)

  const message = await prisma.messages.findUnique({ where: { id: messageId } })
  if (!message) {
    throw new AppError('消息不存在', 404)
  }

  if (message.type !== 'private') {
    throw new AppError('仅可回复私密消息', 400)
  }

  const reply = await prisma.private_replies.create({
    data: {
      message_id: messageId,
      streamer_id: userId,
      target_user_id: message.sender_id,
      content
    },
    select: { id: true, message_id: true, streamer_id: true, target_user_id: true, content: true, created_at: true }
  })

  await prisma.admin_logs.create({
    data: {
      admin_id: userId,
      action: 'create_private_reply',
      target_type: 'private_reply',
      target_id: reply.id,
      detail: `主播回复消息 ${messageId}`
    }
  })

  return {
    id: reply.id,
    messageId: reply.message_id,
    streamerId: reply.streamer_id,
    targetUserId: reply.target_user_id,
    content: reply.content,
    createdAt: reply.created_at
  }
}

export const getPrivateReplies = async (messageId: number, userId: number, userRole: string) => {
  const message = await prisma.messages.findUnique({ where: { id: messageId } })
  if (!message) {
    throw new AppError('消息不存在', 404)
  }

  if (userRole === 'admin') {
    throw new AppError('管理员无权查看私密回复', 403)
  }

  const whereClause: any = { message_id: messageId }
  
  if (userRole === 'fan') {
    whereClause.target_user_id = userId
  }

  const replies = await prisma.private_replies.findMany({
    where: whereClause,
    orderBy: { created_at: 'desc' },
    include: {
      users_private_replies_streamer_idTousers: { select: { id: true, nickname: true } }
    }
  })

  return replies.map(reply => ({
    id: reply.id,
    messageId: reply.message_id,
    streamerId: reply.streamer_id,
    streamerNickname: reply.users_private_replies_streamer_idTousers?.nickname || '',
    targetUserId: reply.target_user_id,
    content: reply.content,
    createdAt: reply.created_at
  }))
}

export default {
  getPublicMessages,
  sendMessage,
  likeMessage,
  unlikeMessage,
  getPrivateMessages,
  reportMessage,
  streamerReply,
  privateReply,
  getPrivateReplies
}
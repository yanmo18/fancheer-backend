/**
 * 聊天室服务
 */

import { prisma } from '../lib/prisma'
import redis from '../config/redis'
import AppError from '../utils/appError'
import { EXPIRY_TIME, REDIS_KEYS } from '../config/constants'

const getLikeCount = async (messageId: bigint) => {
  return prisma.likes.count({ where: { message_id: messageId } })
}

const checkMessageRateLimit = async (userId: bigint) => {
  const key = REDIS_KEYS.messageRateLimit(userId)
  const lastMessage = await redis.get(key)
  if (lastMessage) {
    throw new AppError('发送过于频繁，请20秒后再试', 429)
  }
  await redis.set(key, '1', 'EX', EXPIRY_TIME.MESSAGE_COOLDOWN)
}

export const getPublicMessages = async (before?: string, limit: number = 20, userId?: bigint) => {
  const whereClause: { type: 'public'; created_at?: { lt: Date } } = { type: 'public' }

  if (before) {
    whereClause.created_at = { lt: new Date(before) }
  }

  const messages = await prisma.messages.findMany({
    where: whereClause,
    take: Math.min(limit, 20),
    orderBy: { created_at: 'desc' },
    include: {
      users: { select: { id: true, nickname: true, avatars: true } },
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
    id: msg.id,
    senderId: msg.users.id,
    senderNickname: msg.users.nickname || '',
    senderAvatar: msg.users.avatars?.url || '',
    content: msg.content,
    type: msg.type,
    likeCount: msg._count.likes,
    isLiked: likedMessageIds.includes(msg.id),
    createdAt: msg.created_at
  }))
}

export const sendMessage = async (userId: bigint, content: string, type: string = 'public') => {
  await checkMessageRateLimit(userId)

  const message = await prisma.messages.create({
    data: {
      sender_id: userId,
      content,
      type: type as 'public' | 'private'
    },
    select: { id: true, content: true, type: true, created_at: true }
  })

  return {
    id: message.id,
    content: message.content,
    type: message.type,
    likeCount: 0,
    createdAt: message.created_at
  }
}

export const likeMessage = async (userId: bigint, messageId: bigint) => {
  const idempotencyKey = REDIS_KEYS.likeAdd(userId, messageId)
  const existing = await redis.get(idempotencyKey)
  if (existing) {
    return { likeCount: await getLikeCount(messageId) }
  }

  await redis.set(idempotencyKey, '1', 'EX', EXPIRY_TIME.LIKE_IDEMPOTENT)

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

  await prisma.$transaction([
    prisma.likes.create({ data: { user_id: userId, message_id: messageId } }),
    prisma.messages.update({
      where: { id: messageId },
      data: { like_count: { increment: 1 } }
    })
  ])

  return { likeCount: await getLikeCount(messageId) }
}

export const unlikeMessage = async (userId: bigint, messageId: bigint) => {
  const idempotencyKey = REDIS_KEYS.likeRemove(userId, messageId)
  const existing = await redis.get(idempotencyKey)
  if (existing) {
    return { likeCount: await getLikeCount(messageId) }
  }

  await redis.set(idempotencyKey, '1', 'EX', EXPIRY_TIME.LIKE_IDEMPOTENT)

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

  await prisma.$transaction([
    prisma.likes.delete({
      where: { user_id_message_id: { user_id: userId, message_id: messageId } }
    }),
    prisma.messages.update({
      where: { id: messageId },
      data: { like_count: { decrement: 1 } }
    })
  ])

  return { likeCount: await getLikeCount(messageId) }
}

export const getPublicReplies = async (before?: string, limit: number = 20) => {
  const whereClause: { is_public: true; created_at?: { lt: Date } } = { is_public: true }

  if (before) {
    whereClause.created_at = { lt: new Date(before) }
  }

  const replies = await prisma.private_replies.findMany({
    where: whereClause,
    take: Math.min(limit, 20),
    orderBy: { created_at: 'desc' },
    include: {
      messages: { select: { content: true } },
      users_private_replies_streamer_idTousers: { select: { id: true, nickname: true, avatars: true } }
    }
  })

  return replies.map(reply => ({
    id: reply.id,
    messageId: reply.message_id,
    originalContent: reply.messages?.content || '',
    streamerId: reply.streamer_id,
    streamerNickname: reply.users_private_replies_streamer_idTousers?.nickname || '',
    streamerAvatar: reply.users_private_replies_streamer_idTousers?.avatars?.url || '',
    content: reply.content,
    createdAt: reply.created_at
  }))
}

export const getPrivateMessages = async (userId: bigint, page: number, pageSize: number) => {
  const skip = (page - 1) * pageSize

  const [list, total] = await Promise.all([
    prisma.private_replies.findMany({
      where: { target_user_id: userId, is_public: true },
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' },
      include: {
        messages: { select: { content: true } },
        users_private_replies_streamer_idTousers: { select: { id: true, nickname: true, avatars: true } }
      }
    }),
    prisma.private_replies.count({ where: { target_user_id: userId, is_public: true } })
  ])

  return {
    list: list.map(reply => ({
      id: reply.id,
      messageId: reply.message_id,
      originalContent: reply.messages?.content || '',
      streamerId: reply.streamer_id,
      streamerNickname: reply.users_private_replies_streamer_idTousers?.nickname || '',
      streamerAvatar: reply.users_private_replies_streamer_idTousers?.avatars?.url || '',
      content: reply.content,
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

export const reportMessage = async (userId: bigint, messageId: bigint, reason: string) => {
  const message = await prisma.messages.findUnique({ where: { id: messageId } })
  if (!message) {
    throw new AppError('消息不存在', 404)
  }

  if (message.sender_id === userId) {
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

export const streamerReply = async (userId: bigint, messageId: bigint, content: string, replyType: string = 'public') => {
  await checkMessageRateLimit(userId)

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

export const privateReply = async (userId: bigint, messageId: bigint, content: string) => {
  await checkMessageRateLimit(userId)

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
      content,
      is_public: true
    },
    select: { id: true, message_id: true, streamer_id: true, target_user_id: true, content: true, is_public: true, created_at: true }
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
    isPublic: reply.is_public,
    createdAt: reply.created_at
  }
}

export const getPrivateReplies = async (messageId: bigint, userId: bigint, userRole: string) => {
  const message = await prisma.messages.findUnique({ where: { id: messageId } })
  if (!message) {
    throw new AppError('消息不存在', 404)
  }

  if (userRole === 'admin') {
    throw new AppError('管理员无权查看私密回复', 403)
  }

  const whereClause: { message_id: bigint; target_user_id?: bigint } = { message_id: messageId }

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
  getPublicReplies,
  sendMessage,
  likeMessage,
  unlikeMessage,
  getPrivateMessages,
  reportMessage,
  streamerReply,
  privateReply,
  getPrivateReplies
}

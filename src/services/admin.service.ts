/**
 * 管理后台服务
 * 
 * 作用：实现管理后台相关业务逻辑（用户管理/消息管理/头像池管理/敏感词管理/操作日志）
 *       与数据库交互、处理业务规则
 */

import { prisma } from '../lib/prisma'
import redis from '../config/redis'
import AppError from '../utils/appError'

export const getUsers = async (page: number, pageSize: number, role?: string, status?: string, keyword?: string) => {
  const skip = (page - 1) * pageSize

  const whereClause: any = {}
  if (role) whereClause.role = role
  if (status) whereClause.status = status
  if (keyword) {
    whereClause.OR = [
      { username: { contains: keyword } },
      { nickname: { contains: keyword } }
    ]
  }

  const [list, total] = await Promise.all([
    prisma.users.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' },
      include: { avatars: true }
    }),
    prisma.users.count({ where: whereClause })
  ])

  return {
    list: list.map(user => ({
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatars?.url || '',
      role: user.role,
      status: user.status,
      createdAt: user.created_at
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}

export const banUser = async (id: number, adminId: number) => {
  const user = await prisma.users.findUnique({ where: { id } })
  if (!user) {
    throw new AppError('用户不存在', 404)
  }

  if (user.role === 'admin' || user.role === 'streamer') {
    throw new AppError('不能封禁管理员或主播', 400)
  }

  await prisma.users.update({
    where: { id },
    data: {
      status: 'banned',
      updated_at: new Date()
    }
  })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'ban_user',
      target_type: 'user',
      target_id: id,
      detail: `封禁用户: ${user.username}`
    }
  })
}

export const unbanUser = async (id: number, adminId: number) => {
  const user = await prisma.users.findUnique({ where: { id } })
  if (!user) {
    throw new AppError('用户不存在', 404)
  }

  await prisma.users.update({
    where: { id },
    data: {
      status: 'active',
      updated_at: new Date()
    }
  })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'unban_user',
      target_type: 'user',
      target_id: id,
      detail: `解封用户: ${user.username}`
    }
  })
}

export const getPublicMessages = async (page: number, pageSize: number, keyword?: string) => {
  const skip = (page - 1) * pageSize

  const whereClause: any = { type: 'public' }
  if (keyword) {
    whereClause.content = { contains: keyword }
  }

  const [list, total] = await Promise.all([
    prisma.messages.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' },
      include: {
        users: { select: { id: true, nickname: true, username: true, role: true } },
        _count: { select: { likes: true } }
      }
    }),
    prisma.messages.count({ where: whereClause })
  ])

  return {
    list: list.map(msg => ({
      id: msg.id,
      senderId: msg.users.id,
      senderNickname: msg.users.nickname || msg.users.username,
      senderUsername: msg.users.username,
      senderRole: msg.users.role,
      content: msg.content,
      type: msg.type,
      likeCount: msg._count.likes,
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

export const getPrivateMessages = async (page: number, pageSize: number, userId?: number) => {
  const skip = (page - 1) * pageSize

  const whereClause: any = { type: 'private' }
  if (userId) {
    whereClause.sender_id = userId
  }

  const [list, total] = await Promise.all([
    prisma.messages.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' },
      include: {
        users: { select: { id: true, nickname: true, username: true } },
        _count: { select: { likes: true } }
      }
    }),
    prisma.messages.count({ where: whereClause })
  ])

  return {
    list: list.map(msg => ({
      id: msg.id,
      senderId: msg.users.id,
      senderNickname: msg.users.nickname || msg.users.username,
      content: msg.content,
      likeCount: msg._count.likes,
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

export const deleteMessage = async (id: number, adminId: number) => {
  const message = await prisma.messages.findUnique({ where: { id } })
  if (!message) {
    throw new AppError('消息不存在', 404)
  }

  await prisma.messages.delete({
    where: { id }
  })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'delete_message',
      target_type: 'message',
      target_id: id,
      detail: `删除消息: ${id}`
    }
  })
}

export const getAvatars = async (page: number, pageSize: number) => {
  const skip = (page - 1) * pageSize

  const [list, total] = await Promise.all([
    prisma.avatars.findMany({
      skip,
      take: pageSize,
      orderBy: { sort_order: 'desc' }
    }),
    prisma.avatars.count()
  ])

  return {
    list: list.map(avatar => ({
      id: avatar.id,
      url: avatar.url,
      sortOrder: avatar.sort_order,
      createdAt: avatar.created_at
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}

export const createAvatar = async (url: string, sortOrder: number, adminId: number) => {
  const avatar = await prisma.avatars.create({
    data: {
      url,
      sort_order: sortOrder
    },
    select: { id: true }
  })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'create_avatar',
      target_type: 'avatar',
      target_id: avatar.id,
      detail: `新增头像: ${url}`
    }
  })

  return { id: avatar.id }
}

export const deleteAvatar = async (id: number, adminId: number) => {
  const avatar = await prisma.avatars.findUnique({ where: { id } })
  if (!avatar) {
    throw new AppError('头像不存在', 404)
  }

  await prisma.avatars.delete({
    where: { id }
  })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'delete_avatar',
      target_type: 'avatar',
      target_id: id,
      detail: `删除头像: ${avatar.url}`
    }
  })
}

export const getSensitiveWords = async (page: number, pageSize: number) => {
  const skip = (page - 1) * pageSize

  const [list, total] = await Promise.all([
    prisma.sensitive_words.findMany({
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' }
    }),
    prisma.sensitive_words.count()
  ])

  return {
    list: list.map(word => ({
      id: word.id,
      word: word.word,
      createdAt: word.created_at
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}

export const createSensitiveWord = async (word: string, adminId: number) => {
  const existing = await prisma.sensitive_words.findUnique({ where: { word } })
  if (existing) {
    throw new AppError('敏感词已存在', 409)
  }

  const sensitiveWord = await prisma.sensitive_words.create({
    data: { word },
    select: { id: true }
  })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'create_sensitive_word',
      target_type: 'sensitive_word',
      target_id: sensitiveWord.id,
      detail: `新增敏感词: ${word}`
    }
  })

  return { id: sensitiveWord.id }
}

export const deleteSensitiveWord = async (id: number, adminId: number) => {
  const sensitiveWord = await prisma.sensitive_words.findUnique({ where: { id } })
  if (!sensitiveWord) {
    throw new AppError('敏感词不存在', 404)
  }

  await prisma.sensitive_words.delete({
    where: { id }
  })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'delete_sensitive_word',
      target_type: 'sensitive_word',
      target_id: id,
      detail: `删除敏感词: ${sensitiveWord.word}`
    }
  })
}

export const getLogs = async (page: number, pageSize: number) => {
  const skip = (page - 1) * pageSize
  const [list, total] = await Promise.all([
    prisma.admin_logs.findMany({
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' }
    }),
    prisma.admin_logs.count()
  ])

  return {
    list,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}

export const updateUserRole = async (targetUserId: bigint, newRole: string, operatorId: bigint) => {
  const targetUser = await prisma.users.findUnique({
    where: { id: targetUserId },
    select: { id: true, username: true, role: true }
  })

  if (!targetUser) {
    throw new AppError('目标用户不存在', 404)
  }

  if (targetUser.role === 'streamer') {
    throw new AppError('不能修改主播的角色', 403)
  }

  if (targetUserId === operatorId) {
    throw new AppError('不能修改自己的角色', 403)
  }

  if (targetUser.role === newRole) {
    return {
      userId: targetUser.id.toString(),
      username: targetUser.username,
      role: targetUser.role
    }
  }

  const updatedUser = await prisma.users.update({
    where: { id: targetUserId },
    data: { role: newRole as 'fan' | 'admin' },
    select: { id: true, username: true, role: true }
  })

  const action = newRole === 'admin' ? 'promote_admin' : 'demote_admin'
  const detail = newRole === 'admin'
    ? `将用户 ${targetUser.username} 设为管理员`
    : `取消用户 ${targetUser.username} 的管理员权限`

  await prisma.admin_logs.create({
    data: {
      admin_id: operatorId,
      action,
      target_type: 'user',
      target_id: targetUserId,
      detail
    }
  })

  return {
    userId: updatedUser.id.toString(),
    username: updatedUser.username,
    role: updatedUser.role
  }
}

export default {
  getUsers,
  banUser,
  unbanUser,
  updateUserRole,
  getPublicMessages,
  getPrivateMessages,
  deleteMessage,
  getAvatars,
  createAvatar,
  deleteAvatar,
  getSensitiveWords,
  createSensitiveWord,
  deleteSensitiveWord,
  getLogs
}
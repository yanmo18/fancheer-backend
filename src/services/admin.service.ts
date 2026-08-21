/**
 * 管理后台服务
 */

import { prisma } from '../lib/prisma'
import AppError from '../utils/appError'
import { deleteLocalUpload } from './upload.service'
import { loadSensitiveWords } from '../utils/sensitiveWord'

const USER_ROLES = new Set(['fan', 'admin', 'streamer'])
const USER_STATUSES = new Set(['active', 'banned'])

function parseUserRole(role?: string) {
  if (!role) return undefined
  if (!USER_ROLES.has(role)) throw new AppError('无效的角色筛选', 400)
  return role
}

function parseUserStatus(status?: string) {
  if (!status) return undefined
  if (!USER_STATUSES.has(status)) throw new AppError('无效的状态筛选', 400)
  return status
}

export const getUsers = async (page: number, pageSize: number, role?: string, status?: string, keyword?: string) => {
  const skip = (page - 1) * pageSize

  const whereClause: Record<string, unknown> = {}
  const parsedRole = parseUserRole(role)
  const parsedStatus = parseUserStatus(status)
  if (parsedRole) whereClause.role = parsedRole
  if (parsedStatus) whereClause.status = parsedStatus
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
      banRemark: user.ban_remark || '',
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

export const banUser = async (id: bigint, adminId: bigint, remark?: string) => {
  const user = await prisma.users.findUnique({ where: { id } })
  if (!user) {
    throw new AppError('用户不存在', 404)
  }

  if (user.role === 'admin' || user.role === 'streamer') {
    throw new AppError('不能封禁协管员或站主', 400)
  }

  const banRemark = remark?.trim()
  if (!banRemark) {
    throw new AppError('请填写封禁备注', 400)
  }

  await prisma.users.update({
    where: { id },
    data: { status: 'banned', ban_remark: banRemark, updated_at: new Date() }
  })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'ban_user',
      target_type: 'user',
      target_id: id,
      detail: `封禁用户: ${user.username}，备注: ${banRemark}`
    }
  })
}

export const unbanUser = async (id: bigint, adminId: bigint) => {
  const user = await prisma.users.findUnique({ where: { id } })
  if (!user) {
    throw new AppError('用户不存在', 404)
  }

  await prisma.users.update({
    where: { id },
    data: { status: 'active', ban_remark: null, updated_at: new Date() }
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

  const whereClause: { type: 'public'; content?: { contains: string } } = { type: 'public' }
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

export const getPrivateMessages = async (page: number, pageSize: number, userId?: bigint) => {
  const skip = (page - 1) * pageSize

  const whereClause: { type: 'private'; sender_id?: bigint } = { type: 'private' }
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

export const deleteMessage = async (id: bigint, adminId: bigint) => {
  const message = await prisma.messages.findUnique({ where: { id } })
  if (!message) {
    throw new AppError('消息不存在', 404)
  }

  await prisma.messages.delete({ where: { id } })

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

export const createAvatar = async (url: string, sortOrder: number, adminId: bigint) => {
  const avatar = await prisma.avatars.create({
    data: { url, sort_order: sortOrder },
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

export const deleteAvatar = async (id: bigint, adminId: bigint) => {
  const avatar = await prisma.avatars.findUnique({ where: { id } })
  if (!avatar) {
    throw new AppError('头像不存在', 404)
  }

  const usageCount = await prisma.users.count({ where: { avatar_id: id } })
  if (usageCount > 0) {
    throw new AppError(`该头像正在被 ${usageCount} 个用户使用，无法删除`, 400)
  }

  await prisma.avatars.delete({ where: { id } })
  deleteLocalUpload(avatar.url)

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

export const createSensitiveWord = async (word: string, adminId: bigint) => {
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

  await loadSensitiveWords()

  return { id: sensitiveWord.id }
}

export const deleteSensitiveWord = async (id: bigint, adminId: bigint) => {
  const sensitiveWord = await prisma.sensitive_words.findUnique({ where: { id } })
  if (!sensitiveWord) {
    throw new AppError('敏感词不存在', 404)
  }

  await prisma.sensitive_words.delete({ where: { id } })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'delete_sensitive_word',
      target_type: 'sensitive_word',
      target_id: id,
      detail: `删除敏感词: ${sensitiveWord.word}`
    }
  })

  await loadSensitiveWords()
}

export const getLogs = async (
  page: number,
  pageSize: number,
  filters: {
    action?: string
    keyword?: string
    operator?: string
    startDate?: string
    endDate?: string
  } = {}
) => {
  const skip = (page - 1) * pageSize
  const whereClause: {
    action?: string
    detail?: { contains: string }
    created_at?: { gte?: Date; lte?: Date }
    users?: { OR: Array<{ nickname?: { contains: string }; username?: { contains: string } }> }
  } = {}

  if (filters.action) {
    whereClause.action = filters.action
  }

  if (filters.keyword) {
    whereClause.detail = { contains: filters.keyword }
  }

  if (filters.startDate || filters.endDate) {
    whereClause.created_at = {}
    if (filters.startDate) {
      whereClause.created_at.gte = new Date(`${filters.startDate}T00:00:00`)
    }
    if (filters.endDate) {
      whereClause.created_at.lte = new Date(`${filters.endDate}T23:59:59`)
    }
  }

  if (filters.operator) {
    whereClause.users = {
      OR: [
        { nickname: { contains: filters.operator } },
        { username: { contains: filters.operator } }
      ]
    }
  }

  const [list, total] = await Promise.all([
    prisma.admin_logs.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' },
      include: {
        users: { select: { nickname: true, username: true } }
      }
    }),
    prisma.admin_logs.count({ where: whereClause })
  ])

  return {
    list: list.map(log => ({
      id: log.id,
      adminId: log.admin_id,
      adminNickname: log.users?.nickname || log.users?.username || '',
      action: log.action,
      targetType: log.target_type,
      targetId: log.target_id,
      detail: log.detail,
      createdAt: log.created_at
    })),
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
    throw new AppError('不能修改站主的角色', 403)
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

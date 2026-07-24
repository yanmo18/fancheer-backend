/**
 * 管理后台服务
 * 
 * 作用：实现管理后台相关业务逻辑（用户管理/操作日志）
 *       与数据库交互、处理业务规则
 */

import { prisma } from '../lib/prisma'
import { redis } from '../config/redis'
import AppError from '../utils/appError'

export const getUsers = async (page: number, pageSize: number, role?: string, status?: string) => {
  const skip = (page - 1) * pageSize

  const whereClause: any = {}
  if (role) whereClause.role = role
  if (status) whereClause.status = status

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
      createdAt: user.created_at,
      updatedAt: user.updated_at
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}

export const updateUserStatus = async (id: number, status: string) => {
  const user = await prisma.users.findUnique({ where: { id } })
  if (!user) {
    throw new AppError('用户不存在', 404)
  }

  await prisma.users.update({
    where: { id },
    data: {
      status: status as 'active' | 'banned',
      updated_at: new Date()
    }
  })

  if (status === 'banned') {
    await prisma.admin_logs.create({
      data: {
        action: 'ban_user',
        target_id: id,
        description: `封禁用户: ${user.username}`
      }
    })
  } else {
    await prisma.admin_logs.create({
      data: {
        action: 'unban_user',
        target_id: id,
        description: `解封用户: ${user.username}`
      }
    })
  }
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

export default {
  getUsers,
  updateUserStatus,
  getLogs
}
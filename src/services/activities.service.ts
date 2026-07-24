/**
 * 活动日历服务
 * 
 * 作用：实现活动日历相关业务逻辑（前台获取/后台CRUD）
 *       与数据库交互、处理业务规则
 */

import { prisma } from '../lib/prisma'
import AppError from '../utils/appError'

export const getActivities = async () => {
  const activities = await prisma.activities.findMany({
    orderBy: { activity_date: 'asc' },
    select: {
      id: true,
      title: true,
      description: true,
      activity_date: true,
      sort_order: true
    }
  })

  return activities.map(activity => ({
    ...activity,
    activityDate: activity.activity_date,
    sortOrder: activity.sort_order
  }))
}

export const getAdminActivities = async (page: number, pageSize: number) => {
  const skip = (page - 1) * pageSize
  const [list, total] = await Promise.all([
    prisma.activities.findMany({
      skip,
      take: pageSize,
      orderBy: { activity_date: 'asc' }
    }),
    prisma.activities.count()
  ])

  return {
    list: list.map(activity => ({
      ...activity,
      activityDate: activity.activity_date,
      sortOrder: activity.sort_order,
      createdAt: activity.created_at,
      updatedAt: activity.updated_at
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}

export const createActivity = async ({ title, description, activityDate, sortOrder }: {
  title: string
  description?: string
  activityDate: string
  sortOrder?: number
}) => {
  const activity = await prisma.activities.create({
    data: {
      title,
      description: description || '',
      activity_date: activityDate,
      sort_order: sortOrder || 0
    },
    select: { id: true }
  })

  return { id: activity.id }
}

export const updateActivity = async (id: number, { title, description, activityDate, sortOrder }: {
  title?: string
  description?: string
  activityDate?: string
  sortOrder?: number
}) => {
  const activity = await prisma.activities.findUnique({ where: { id } })
  if (!activity) {
    throw new AppError('活动不存在', 404)
  }

  const updateData: Record<string, any> = {}
  if (title !== undefined) updateData.title = title
  if (description !== undefined) updateData.description = description
  if (activityDate !== undefined) updateData.activity_date = activityDate
  if (sortOrder !== undefined) updateData.sort_order = sortOrder
  updateData.updated_at = new Date()

  await prisma.activities.update({
    where: { id },
    data: updateData
  })
}

export const deleteActivity = async (id: number) => {
  const activity = await prisma.activities.findUnique({ where: { id } })
  if (!activity) {
    throw new AppError('活动不存在', 404)
  }

  await prisma.activities.delete({ where: { id } })
}

export default {
  getActivities,
  getAdminActivities,
  createActivity,
  updateActivity,
  deleteActivity
}
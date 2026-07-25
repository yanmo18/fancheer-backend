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
    orderBy: { start_time: 'asc' },
    select: {
      id: true,
      title: true,
      description: true,
      cover_url: true,
      start_time: true,
      end_time: true,
      sort_order: true
    }
  })

  return activities.map(activity => ({
    ...activity,
    coverUrl: activity.cover_url,
    startTime: activity.start_time,
    endTime: activity.end_time,
    sortOrder: activity.sort_order
  }))
}

export const getAdminActivities = async (page: number, pageSize: number) => {
  const skip = (page - 1) * pageSize
  const [list, total] = await Promise.all([
    prisma.activities.findMany({
      skip,
      take: pageSize,
      orderBy: { start_time: 'asc' }
    }),
    prisma.activities.count()
  ])

  return {
    list: list.map(activity => ({
      ...activity,
      coverUrl: activity.cover_url,
      startTime: activity.start_time,
      endTime: activity.end_time,
      sortOrder: activity.sort_order,
      createdAt: activity.created_at
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}

export const createActivity = async ({ title, description, coverUrl, startTime, endTime, sortOrder }: {
  title: string
  description?: string
  coverUrl?: string
  startTime: string
  endTime?: string
  sortOrder?: number
}) => {
  const activity = await prisma.activities.create({
    data: {
      title,
      description: description || '',
      cover_url: coverUrl || '',
      start_time: startTime,
      end_time: endTime || null,
      sort_order: sortOrder || 0
    },
    select: { id: true }
  })

  return { id: activity.id }
}

export const updateActivity = async (id: number, { title, description, coverUrl, startTime, endTime, sortOrder }: {
  title?: string
  description?: string
  coverUrl?: string
  startTime?: string
  endTime?: string
  sortOrder?: number
}) => {
  const activity = await prisma.activities.findUnique({ where: { id } })
  if (!activity) {
    throw new AppError('活动不存在', 404)
  }

  const updateData: Record<string, any> = {}
  if (title !== undefined) updateData.title = title
  if (description !== undefined) updateData.description = description
  if (coverUrl !== undefined) updateData.cover_url = coverUrl
  if (startTime !== undefined) updateData.start_time = startTime
  if (endTime !== undefined) updateData.end_time = endTime || null
  if (sortOrder !== undefined) updateData.sort_order = sortOrder

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
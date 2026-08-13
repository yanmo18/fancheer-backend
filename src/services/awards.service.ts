/**
 * 获奖记录服务
 */

import { prisma } from '../lib/prisma'
import AppError from '../utils/appError'

export const getAwards = async () => {
  const awards = await prisma.awards.findMany({
    orderBy: { award_date: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      image_url: true,
      award_date: true,
      sort_order: true
    }
  })

  return awards.map(award => ({
    id: award.id,
    title: award.title,
    description: award.description,
    imageUrl: award.image_url,
    awardDate: award.award_date,
    sortOrder: award.sort_order
  }))
}

export const getAdminAwards = async (page: number, pageSize: number) => {
  const skip = (page - 1) * pageSize
  const [list, total] = await Promise.all([
    prisma.awards.findMany({
      skip,
      take: pageSize,
      orderBy: { award_date: 'desc' }
    }),
    prisma.awards.count()
  ])

  return {
    list: list.map(award => ({
      id: award.id,
      title: award.title,
      description: award.description,
      imageUrl: award.image_url,
      awardDate: award.award_date,
      sortOrder: award.sort_order,
      createdAt: award.created_at,
      updatedAt: award.updated_at
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}

export const createAward = async ({ title, description, imageUrl, awardDate, sortOrder }: {
  title: string
  description?: string
  imageUrl?: string
  awardDate?: string
  sortOrder?: number
}, adminId: bigint) => {
  const award = await prisma.awards.create({
    data: {
      title,
      description: description || '',
      image_url: imageUrl || '',
      award_date: awardDate || null,
      sort_order: sortOrder || 0
    },
    select: { id: true }
  })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'create_award',
      target_type: 'award',
      target_id: award.id,
      detail: `创建获奖记录: ${title}`
    }
  })

  return { id: award.id }
}

export const updateAward = async (id: bigint, { title, description, imageUrl, awardDate, sortOrder }: {
  title?: string
  description?: string
  imageUrl?: string
  awardDate?: string
  sortOrder?: number
}, adminId: bigint) => {
  const award = await prisma.awards.findUnique({ where: { id } })
  if (!award) {
    throw new AppError('获奖记录不存在', 404)
  }

  const updateData: Record<string, unknown> = { updated_at: new Date() }
  if (title !== undefined) updateData.title = title
  if (description !== undefined) updateData.description = description
  if (imageUrl !== undefined) updateData.image_url = imageUrl
  if (awardDate !== undefined) updateData.award_date = awardDate || null
  if (sortOrder !== undefined) updateData.sort_order = sortOrder

  await prisma.awards.update({ where: { id }, data: updateData })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'update_award',
      target_type: 'award',
      target_id: id,
      detail: `更新获奖记录: ${id}`
    }
  })
}

export const deleteAward = async (id: bigint, adminId: bigint) => {
  const award = await prisma.awards.findUnique({ where: { id } })
  if (!award) {
    throw new AppError('获奖记录不存在', 404)
  }

  await prisma.awards.delete({ where: { id } })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'delete_award',
      target_type: 'award',
      target_id: id,
      detail: `删除获奖记录: ${award.title}`
    }
  })
}

export default {
  getAwards,
  getAdminAwards,
  createAward,
  updateAward,
  deleteAward
}

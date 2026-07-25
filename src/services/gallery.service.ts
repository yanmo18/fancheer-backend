/**
 * 图集服务
 * 
 * 作用：实现图集相关业务逻辑（二次元/三次元）
 *       与数据库交互、处理业务规则
 */

import { prisma } from '../lib/prisma'
import AppError from '../utils/appError'

export const getGallery = async (category?: string) => {
  const whereClause: any = {}
  if (category) {
    whereClause.category = category
  }

  const images = await prisma.gallery_images.findMany({
    where: whereClause,
    orderBy: { sort_order: 'desc' },
    select: {
      id: true,
      url: true,
      category: true,
      sort_order: true
    }
  })

  return images.map(img => ({
    ...img,
    imageUrl: img.url,
    sortOrder: img.sort_order
  }))
}

export const getAdminGallery = async (page: number, pageSize: number) => {
  const skip = (page - 1) * pageSize
  const [list, total] = await Promise.all([
    prisma.gallery_images.findMany({
      skip,
      take: pageSize,
      orderBy: { sort_order: 'desc' }
    }),
    prisma.gallery_images.count()
  ])

  return {
    list: list.map(img => ({
      ...img,
      imageUrl: img.url,
      sortOrder: img.sort_order,
      createdAt: img.created_at
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}

export const createGalleryImage = async ({ imageUrl, category, sortOrder }: {
  imageUrl: string
  category: string
  sortOrder?: number
}) => {
  const image = await prisma.gallery_images.create({
    data: {
      url: imageUrl,
      category,
      sort_order: sortOrder || 0
    },
    select: { id: true }
  })

  return { id: image.id }
}

export const updateGalleryImage = async (id: number, { imageUrl, category, sortOrder }: {
  imageUrl?: string
  category?: string
  sortOrder?: number
}) => {
  const image = await prisma.gallery_images.findUnique({ where: { id } })
  if (!image) {
    throw new AppError('图片不存在', 404)
  }

  const updateData: Record<string, any> = {}
  if (imageUrl !== undefined) updateData.url = imageUrl
  if (category !== undefined) updateData.category = category
  if (sortOrder !== undefined) updateData.sort_order = sortOrder

  await prisma.gallery_images.update({
    where: { id },
    data: updateData
  })
}

export const deleteGalleryImage = async (id: number) => {
  const image = await prisma.gallery_images.findUnique({ where: { id } })
  if (!image) {
    throw new AppError('图片不存在', 404)
  }

  await prisma.gallery_images.delete({ where: { id } })
}

export default {
  getGallery,
  getAdminGallery,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage
}
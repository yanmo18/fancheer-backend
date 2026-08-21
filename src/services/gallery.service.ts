/**
 * 图集服务
 */

import { prisma } from '../lib/prisma'
import AppError from '../utils/appError'

export const getGallery = async (category?: string) => {
  const whereClause: { category?: 'anime' | 'real' } = {}
  if (category) {
    whereClause.category = category as 'anime' | 'real'
  }

  const images = await prisma.gallery_images.findMany({
    where: whereClause,
    orderBy: { sort_order: 'desc' },
    select: {
      id: true,
      url: true,
      title: true,
      category: true,
      sort_order: true
    }
  })

  return images.map(img => ({
    id: img.id,
    imageUrl: img.url,
    title: img.title,
    category: img.category,
    sortOrder: img.sort_order
  }))
}

export const getAdminGallery = async (page: number, pageSize: number) => {
  const skip = (page - 1) * pageSize
  const [list, total, anime, real] = await Promise.all([
    prisma.gallery_images.findMany({
      skip,
      take: pageSize,
      orderBy: { sort_order: 'desc' }
    }),
    prisma.gallery_images.count(),
    prisma.gallery_images.count({ where: { category: 'anime' } }),
    prisma.gallery_images.count({ where: { category: 'real' } }),
  ])

  return {
    list: list.map(img => ({
      id: img.id,
      imageUrl: img.url,
      title: img.title,
      category: img.category,
      sortOrder: img.sort_order,
      createdAt: img.created_at
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    },
    stats: {
      anime,
      real,
    },
  }
}

export const createGalleryImage = async ({ imageUrl, category, sortOrder, title }: {
  imageUrl: string
  category: 'anime' | 'real'
  sortOrder?: number
  title?: string
}, adminId: bigint) => {
  const image = await prisma.gallery_images.create({
    data: {
      url: imageUrl,
      category,
      title: title || '',
      sort_order: sortOrder || 0
    },
    select: { id: true }
  })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'create_gallery_image',
      target_type: 'gallery_image',
      target_id: image.id,
      detail: `创建图集图片: ${category}`
    }
  })

  return { id: image.id }
}

export const updateGalleryImage = async (id: bigint, { imageUrl, category, sortOrder, title }: {
  imageUrl?: string
  category?: string
  sortOrder?: number
  title?: string
}, adminId: bigint) => {
  const image = await prisma.gallery_images.findUnique({ where: { id } })
  if (!image) {
    throw new AppError('图片不存在', 404)
  }

  const updateData: Record<string, unknown> = {}
  if (imageUrl !== undefined) updateData.url = imageUrl
  if (category !== undefined) updateData.category = category
  if (sortOrder !== undefined) updateData.sort_order = sortOrder
  if (title !== undefined) updateData.title = title

  await prisma.gallery_images.update({ where: { id }, data: updateData })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'update_gallery_image',
      target_type: 'gallery_image',
      target_id: id,
      detail: `更新图集图片: ${id}`
    }
  })
}

export const deleteGalleryImage = async (id: bigint, adminId: bigint) => {
  const image = await prisma.gallery_images.findUnique({ where: { id } })
  if (!image) {
    throw new AppError('图片不存在', 404)
  }

  await prisma.gallery_images.delete({ where: { id } })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'delete_gallery_image',
      target_type: 'gallery_image',
      target_id: id,
      detail: `删除图集图片: ${id}`
    }
  })
}

export default {
  getGallery,
  getAdminGallery,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage
}

/**
 * Banner服务
 * 
 * 作用：实现Banner相关业务逻辑（前台获取/后台CRUD）
 *       与数据库交互、处理业务规则
 */

import { prisma } from '../lib/prisma'
import AppError from '../utils/appError'

export const getBanners = async () => {
  const banners = await prisma.banners.findMany({
    where: { is_visible: true },
    orderBy: { sort_order: 'desc' },
    select: {
      id: true,
      title: true,
      image_url: true,
      link_url: true,
      sort_order: true
    }
  })

  return banners.map(banner => ({
    ...banner,
    imageUrl: banner.image_url,
    linkUrl: banner.link_url,
    sortOrder: banner.sort_order
  }))
}

export const getAdminBanners = async (page: number, pageSize: number) => {
  const skip = (page - 1) * pageSize
  const [list, total] = await Promise.all([
    prisma.banners.findMany({
      skip,
      take: pageSize,
      orderBy: { sort_order: 'desc' }
    }),
    prisma.banners.count()
  ])

  return {
    list: list.map(banner => ({
      ...banner,
      imageUrl: banner.image_url,
      linkUrl: banner.link_url,
      sortOrder: banner.sort_order,
      isVisible: banner.is_visible,
      createdAt: banner.created_at,
      updatedAt: banner.updated_at
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}

export const createBanner = async ({ title, imageUrl, linkUrl, sortOrder, isVisible }: {
  title?: string
  imageUrl: string
  linkUrl?: string
  sortOrder?: number
  isVisible?: boolean
}) => {
  const banner = await prisma.banners.create({
    data: {
      title: title || '',
      image_url: imageUrl,
      link_url: linkUrl || '',
      sort_order: sortOrder || 0,
      is_visible: isVisible !== undefined ? isVisible : true
    },
    select: { id: true }
  })

  await prisma.admin_logs.create({
    data: {
      admin_id: 1,
      action: 'create_banner',
      target_id: banner.id,
      detail: `创建Banner: ${title || '无标题'}`
    }
  })

  return { id: banner.id }
}

export const updateBanner = async (id: number, { title, imageUrl, linkUrl, sortOrder, isVisible }: {
  title?: string
  imageUrl?: string
  linkUrl?: string
  sortOrder?: number
  isVisible?: boolean
}) => {
  const banner = await prisma.banners.findUnique({ where: { id } })
  if (!banner) {
    throw new AppError('Banner不存在', 404)
  }

  const updateData: Record<string, any> = {}
  if (title !== undefined) updateData.title = title
  if (imageUrl !== undefined) updateData.image_url = imageUrl
  if (linkUrl !== undefined) updateData.link_url = linkUrl
  if (sortOrder !== undefined) updateData.sort_order = sortOrder
  if (isVisible !== undefined) updateData.is_visible = isVisible
  updateData.updated_at = new Date()

  await prisma.banners.update({
    where: { id },
    data: updateData
  })

  await prisma.admin_logs.create({
    data: {
      admin_id: 1,
      action: 'update_banner',
      target_id: id,
      detail: `更新Banner: ${id}`
    }
  })
}

export const deleteBanner = async (id: number) => {
  const banner = await prisma.banners.findUnique({ where: { id } })
  if (!banner) {
    throw new AppError('Banner不存在', 404)
  }

  await prisma.banners.delete({ where: { id } })

  await prisma.admin_logs.create({
    data: {
      admin_id: 1,
      action: 'delete_banner',
      target_id: id,
      detail: `删除Banner: ${banner.title || '无标题'}`
    }
  })
}

export default {
  getBanners,
  getAdminBanners,
  createBanner,
  updateBanner,
  deleteBanner
}
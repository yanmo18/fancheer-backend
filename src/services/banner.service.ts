/**
 * Banner服务
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
    id: banner.id,
    title: banner.title,
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
      id: banner.id,
      title: banner.title,
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
}, adminId: bigint) => {
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
      admin_id: adminId,
      action: 'create_banner',
      target_type: 'banner',
      target_id: banner.id,
      detail: `创建Banner: ${title || '无标题'}`
    }
  })

  return { id: banner.id }
}

export const updateBanner = async (id: bigint, { title, imageUrl, linkUrl, sortOrder, isVisible }: {
  title?: string
  imageUrl?: string
  linkUrl?: string
  sortOrder?: number
  isVisible?: boolean
}, adminId: bigint) => {
  const banner = await prisma.banners.findUnique({ where: { id } })
  if (!banner) {
    throw new AppError('Banner不存在', 404)
  }

  const updateData: Record<string, unknown> = { updated_at: new Date() }
  if (title !== undefined) updateData.title = title
  if (imageUrl !== undefined) updateData.image_url = imageUrl
  if (linkUrl !== undefined) updateData.link_url = linkUrl
  if (sortOrder !== undefined) updateData.sort_order = sortOrder
  if (isVisible !== undefined) updateData.is_visible = isVisible

  await prisma.banners.update({ where: { id }, data: updateData })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'update_banner',
      target_type: 'banner',
      target_id: id,
      detail: `更新Banner: ${id}`
    }
  })
}

export const deleteBanner = async (id: bigint, adminId: bigint) => {
  const banner = await prisma.banners.findUnique({ where: { id } })
  if (!banner) {
    throw new AppError('Banner不存在', 404)
  }

  await prisma.banners.delete({ where: { id } })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'delete_banner',
      target_type: 'banner',
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

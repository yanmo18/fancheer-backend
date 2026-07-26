/**
 * 主播资料服务
 * 
 * 作用：实现主播资料相关业务逻辑（前台获取/后台编辑）
 *       与数据库交互、处理业务规则
 */

import { prisma } from '../lib/prisma'

export const getStreamerInfo = async () => {
  const info = await prisma.streamer_info.findFirst({
    select: {
      id: true,
      name: true,
      avatar_url: true,
      tags: true,
      bio: true
    }
  })

  if (!info) {
    return null
  }

  return {
    ...info,
    avatarUrl: info.avatar_url,
    tags: info.tags ? info.tags.split(',') : []
  }
}

export const getAdminStreamerInfo = async () => {
  const info = await prisma.streamer_info.findFirst()

  if (!info) {
    return null
  }

  return {
    ...info,
    avatarUrl: info.avatar_url,
    updatedAt: info.updated_at
  }
}

export const updateStreamerInfo = async ({ name, avatarUrl, tags, bio }: {
  name?: string
  avatarUrl?: string
  tags?: string
  bio?: string
}, adminId: number) => {
  const updateData: Record<string, any> = {}
  if (name !== undefined) updateData.name = name
  if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl
  if (tags !== undefined) updateData.tags = tags
  if (bio !== undefined) updateData.bio = bio
  updateData.updated_at = new Date()

  const existing = await prisma.streamer_info.findFirst()

  if (existing) {
    await prisma.streamer_info.update({
      where: { id: existing.id },
      data: updateData
    })
  } else {
    await prisma.streamer_info.create({
      data: {
        name: name || '',
        avatar_url: avatarUrl || '',
        tags: tags || '',
        bio: bio || ''
      }
    })
  }

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'update_streamer_info',
      target_id: existing?.id || 1,
      detail: '更新主播资料'
    }
  })
}

export default {
  getStreamerInfo,
  getAdminStreamerInfo,
  updateStreamerInfo
}
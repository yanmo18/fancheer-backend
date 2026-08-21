/**
 * 主播资料服务
 */

import { prisma } from '../lib/prisma'
import { replaceLocalUpload } from './upload.service'

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
    id: info.id,
    name: info.name,
    avatarUrl: info.avatar_url,
    tags: info.tags ? info.tags.split(',') : [],
    bio: info.bio || ''
  }
}

export const getAdminStreamerInfo = async () => {
  const info = await prisma.streamer_info.findFirst()

  if (!info) {
    return null
  }

  return {
    id: info.id,
    name: info.name,
    avatarUrl: info.avatar_url,
    tags: info.tags || '',
    bio: info.bio || '',
    createdAt: info.created_at,
    updatedAt: info.updated_at
  }
}

export const updateStreamerInfo = async ({ name, avatarUrl, tags, bio }: {
  name?: string
  avatarUrl?: string
  tags?: string
  bio?: string
}, adminId: bigint) => {
  const updateData: Record<string, unknown> = { updated_at: new Date() }
  if (name !== undefined) updateData.name = name
  if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl
  if (tags !== undefined) updateData.tags = tags
  if (bio !== undefined) updateData.bio = bio

  const existing = await prisma.streamer_info.findFirst()
  let targetId: bigint

  if (existing) {
    if (avatarUrl !== undefined && avatarUrl !== existing.avatar_url) {
      replaceLocalUpload(existing.avatar_url, avatarUrl)
    }
    await prisma.streamer_info.update({
      where: { id: existing.id },
      data: updateData
    })
    targetId = existing.id
  } else {
    const created = await prisma.streamer_info.create({
      data: {
        name: name || '',
        avatar_url: avatarUrl || '',
        tags: tags || '',
        bio: bio || ''
      },
      select: { id: true }
    })
    targetId = created.id
  }

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'update_streamer_info',
      target_type: 'streamer_info',
      target_id: targetId,
      detail: '更新主播资料'
    }
  })
}

export default {
  getStreamerInfo,
  getAdminStreamerInfo,
  updateStreamerInfo
}

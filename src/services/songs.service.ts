/**
 * 音乐服务
 */

import { prisma } from '../lib/prisma'
import AppError from '../utils/appError'

export const getSongs = async () => {
  const songs = await prisma.songs.findMany({
    orderBy: { sort_order: 'desc' },
    select: {
      id: true,
      title: true,
      artist: true,
      audio_url: true,
      cover_url: true,
      sort_order: true
    }
  })

  return songs.map(song => ({
    id: song.id,
    title: song.title,
    artist: song.artist,
    audioUrl: song.audio_url,
    coverUrl: song.cover_url,
    sortOrder: song.sort_order
  }))
}

export const getAdminSongs = async (page: number, pageSize: number) => {
  const skip = (page - 1) * pageSize
  const [list, total] = await Promise.all([
    prisma.songs.findMany({
      skip,
      take: pageSize,
      orderBy: { sort_order: 'desc' }
    }),
    prisma.songs.count()
  ])

  return {
    list: list.map(song => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      audioUrl: song.audio_url,
      coverUrl: song.cover_url,
      sortOrder: song.sort_order,
      createdAt: song.created_at
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}

export const createSong = async ({ title, artist, audioUrl, coverUrl, sortOrder }: {
  title: string
  artist?: string
  audioUrl: string
  coverUrl?: string
  sortOrder?: number
}, adminId: bigint) => {
  const song = await prisma.songs.create({
    data: {
      title,
      artist: artist || '',
      audio_url: audioUrl,
      cover_url: coverUrl || '',
      sort_order: sortOrder || 0
    },
    select: { id: true }
  })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'create_song',
      target_type: 'song',
      target_id: song.id,
      detail: `创建歌曲: ${title}`
    }
  })

  return { id: song.id }
}

export const updateSong = async (id: bigint, { title, artist, audioUrl, coverUrl, sortOrder }: {
  title?: string
  artist?: string
  audioUrl?: string
  coverUrl?: string
  sortOrder?: number
}, adminId: bigint) => {
  const song = await prisma.songs.findUnique({ where: { id } })
  if (!song) {
    throw new AppError('歌曲不存在', 404)
  }

  const updateData: Record<string, unknown> = {}
  if (title !== undefined) updateData.title = title
  if (artist !== undefined) updateData.artist = artist
  if (audioUrl !== undefined) updateData.audio_url = audioUrl
  if (coverUrl !== undefined) updateData.cover_url = coverUrl
  if (sortOrder !== undefined) updateData.sort_order = sortOrder

  await prisma.songs.update({ where: { id }, data: updateData })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'update_song',
      target_type: 'song',
      target_id: id,
      detail: `更新歌曲: ${id}`
    }
  })
}

export const deleteSong = async (id: bigint, adminId: bigint) => {
  const song = await prisma.songs.findUnique({ where: { id } })
  if (!song) {
    throw new AppError('歌曲不存在', 404)
  }

  await prisma.songs.delete({ where: { id } })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'delete_song',
      target_type: 'song',
      target_id: id,
      detail: `删除歌曲: ${song.title}`
    }
  })
}

export default {
  getSongs,
  getAdminSongs,
  createSong,
  updateSong,
  deleteSong
}

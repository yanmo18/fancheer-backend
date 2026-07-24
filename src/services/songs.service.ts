/**
 * 音乐服务
 * 
 * 作用：实现音乐相关业务逻辑（歌曲列表）
 *       与数据库交互、处理业务规则
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
    ...song,
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
      ...song,
      audioUrl: song.audio_url,
      coverUrl: song.cover_url,
      sortOrder: song.sort_order,
      createdAt: song.created_at,
      updatedAt: song.updated_at
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
}) => {
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

  return { id: song.id }
}

export const updateSong = async (id: number, { title, artist, audioUrl, coverUrl, sortOrder }: {
  title?: string
  artist?: string
  audioUrl?: string
  coverUrl?: string
  sortOrder?: number
}) => {
  const song = await prisma.songs.findUnique({ where: { id } })
  if (!song) {
    throw new AppError('歌曲不存在', 404)
  }

  const updateData: Record<string, any> = {}
  if (title !== undefined) updateData.title = title
  if (artist !== undefined) updateData.artist = artist
  if (audioUrl !== undefined) updateData.audio_url = audioUrl
  if (coverUrl !== undefined) updateData.cover_url = coverUrl
  if (sortOrder !== undefined) updateData.sort_order = sortOrder
  updateData.updated_at = new Date()

  await prisma.songs.update({
    where: { id },
    data: updateData
  })
}

export const deleteSong = async (id: number) => {
  const song = await prisma.songs.findUnique({ where: { id } })
  if (!song) {
    throw new AppError('歌曲不存在', 404)
  }

  await prisma.songs.delete({ where: { id } })
}

export default {
  getSongs,
  getAdminSongs,
  createSong,
  updateSong,
  deleteSong
}
/**
 * 音乐控制器
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success, fail } from '../utils/response'
import { sanitize } from '../utils/sanitize'
import { parseId, userIdFromRequest } from '../utils/id'
import { parsePagination } from '../utils/pagination'
import songsService from '../services/songs.service'

export const getSongs = async (_req: UserRequest, res: Response) => {
  const result = await songsService.getSongs()
  return res.json(success(result))
}

export const getAdminSongs = async (req: UserRequest, res: Response) => {
  const { page, pageSize } = parsePagination(req.query.page, req.query.pageSize)
  const result = await songsService.getAdminSongs(page, pageSize)
  return res.json(success(result))
}

export const createSong = async (req: UserRequest, res: Response) => {
  const { title, artist, audioUrl, coverUrl, sortOrder = 0 } = req.body
  if (!title) return res.json(fail('歌曲名称不能为空', 400))
  if (!audioUrl) return res.json(fail('音频URL不能为空', 400))

  const result = await songsService.createSong({
    title: sanitize(title),
    artist: sanitize(artist),
    audioUrl,
    coverUrl,
    sortOrder
  }, userIdFromRequest(req.user?.id))
  return res.json(success(result, '歌曲创建成功'))
}

export const updateSong = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const { title, artist, audioUrl, coverUrl, sortOrder } = req.body

  await songsService.updateSong(parseId(id), {
    title: sanitize(title),
    artist: sanitize(artist),
    audioUrl,
    coverUrl,
    sortOrder
  }, userIdFromRequest(req.user?.id))
  return res.json(success(null, '歌曲更新成功'))
}

export const deleteSong = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  await songsService.deleteSong(parseId(id), userIdFromRequest(req.user?.id))
  return res.json(success(null, '歌曲删除成功'))
}

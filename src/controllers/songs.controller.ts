/**
 * 音乐控制器
 * 
 * 作用：处理音乐相关请求（歌曲列表）
 *       接收请求参数、调用服务层、返回响应
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success, fail } from '../utils/response'
import songsService from '../services/songs.service'

export const getSongs = async (req: UserRequest, res: Response) => {
  const result = await songsService.getSongs()
  return res.json(success(result))
}

export const getAdminSongs = async (req: UserRequest, res: Response) => {
  const { page = 1, pageSize = 20 } = req.query
  const result = await songsService.getAdminSongs(Number(page), Number(pageSize))
  return res.json(success(result))
}

export const createSong = async (req: UserRequest, res: Response) => {
  const { title, artist, audioUrl, coverUrl, sortOrder = 0 } = req.body
  const adminId = req.user?.id

  if (!title) return res.json(fail('歌曲名称不能为空', 400))
  if (!audioUrl) return res.json(fail('音频URL不能为空', 400))

  const result = await songsService.createSong({ title, artist, audioUrl, coverUrl, sortOrder }, adminId!)
  return res.json(success(result, '歌曲创建成功'))
}

export const updateSong = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const { title, artist, audioUrl, coverUrl, sortOrder } = req.body
  const adminId = req.user?.id

  await songsService.updateSong(Number(id), { title, artist, audioUrl, coverUrl, sortOrder }, adminId!)
  return res.json(success(null, '歌曲更新成功'))
}

export const deleteSong = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const adminId = req.user?.id

  await songsService.deleteSong(Number(id), adminId!)
  return res.json(success(null, '歌曲删除成功'))
}
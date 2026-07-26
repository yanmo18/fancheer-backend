/**
 * 主播资料控制器
 * 
 * 作用：处理主播资料相关请求（前台获取/后台编辑）
 *       接收请求参数、调用服务层、返回响应
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success, fail } from '../utils/response'
import streamerService from '../services/streamer.service'

export const getStreamerInfo = async (req: UserRequest, res: Response) => {
  const result = await streamerService.getStreamerInfo()
  return res.json(success(result))
}

export const getAdminStreamerInfo = async (req: UserRequest, res: Response) => {
  const result = await streamerService.getAdminStreamerInfo()
  return res.json(success(result))
}

export const updateStreamerInfo = async (req: UserRequest, res: Response) => {
  const { name, avatarUrl, tags, bio } = req.body
  const adminId = req.user?.id

  await streamerService.updateStreamerInfo({ name, avatarUrl, tags, bio }, adminId!)
  return res.json(success(null, '主播资料更新成功'))
}
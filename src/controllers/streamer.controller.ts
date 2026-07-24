/**
 * 主播资料控制器
 * 
 * 作用：处理主播资料相关请求（前台获取/后台编辑）
 *       接收请求参数、调用服务层、返回响应
 */

import { Request, Response } from 'express'
import { success, fail } from '../utils/response'
import streamerService from '../services/streamer.service'

export const getStreamerInfo = async (req: Request, res: Response) => {
  const result = await streamerService.getStreamerInfo()
  return res.json(success(result))
}

export const getAdminStreamerInfo = async (req: Request, res: Response) => {
  const result = await streamerService.getAdminStreamerInfo()
  return res.json(success(result))
}

export const updateStreamerInfo = async (req: Request, res: Response) => {
  const { name, avatarUrl, tags, bio } = req.body
  await streamerService.updateStreamerInfo({ name, avatarUrl, tags, bio })
  return res.json(success(null, '主播资料更新成功'))
}
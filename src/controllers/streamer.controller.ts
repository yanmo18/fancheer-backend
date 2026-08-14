/**
 * 主播资料控制器
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success } from '../utils/response'
import { sanitize } from '../utils/sanitize'
import { userIdFromRequest } from '../utils/id'
import streamerService from '../services/streamer.service'

export const getStreamerInfo = async (_req: UserRequest, res: Response) => {
  const result = await streamerService.getStreamerInfo()
  return res.json(success(result))
}

export const getAdminStreamerInfo = async (_req: UserRequest, res: Response) => {
  const result = await streamerService.getAdminStreamerInfo()
  return res.json(success(result))
}

export const updateStreamerInfo = async (req: UserRequest, res: Response) => {
  const { name, avatarUrl, tags, bio } = req.body

  await streamerService.updateStreamerInfo({
    name: sanitize(name),
    avatarUrl,
    tags: sanitize(tags),
    bio: sanitize(bio)
  }, userIdFromRequest(req.user?.id))
  return res.json(success(null, '博主资料更新成功'))
}

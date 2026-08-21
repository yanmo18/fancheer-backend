/**
 * 主播资料控制器
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success, fail } from '../utils/response'
import { sanitize } from '../utils/sanitize'
import { getSensitiveWordError } from '../utils/sensitiveWord'
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

  const safeName = sanitize(name)
  const safeTags = sanitize(tags)
  const safeBio = sanitize(bio)
  const sensitiveError = getSensitiveWordError(safeName, safeTags, safeBio)
  if (sensitiveError) return res.json(fail(sensitiveError, 400))

  await streamerService.updateStreamerInfo({
    name: safeName,
    avatarUrl,
    tags: safeTags,
    bio: safeBio,
  }, userIdFromRequest(req.user?.id))
  return res.json(success(null, '博主资料更新成功'))
}

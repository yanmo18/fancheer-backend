/**
 * 用户控制器
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success, fail } from '../utils/response'
import { validateNickname } from '../utils/validate'
import { sanitize } from '../utils/sanitize'
import { checkSensitiveWord } from '../utils/sensitiveWord'
import { parseId, userIdFromRequest } from '../utils/id'
import userService from '../services/user.service'

export const updateNickname = async (req: UserRequest, res: Response) => {
  const { nickname } = req.body
  const sanitizedNickname = sanitize(nickname)

  const error = validateNickname(sanitizedNickname)
  if (error) return res.json(fail(error, 400))

  const { hasSensitive, matchedWord } = checkSensitiveWord(sanitizedNickname)
  if (hasSensitive) return res.json(fail(`昵称包含敏感词: ${matchedWord}`, 400))

  const result = await userService.updateNickname(userIdFromRequest(req.user?.id), sanitizedNickname)
  return res.json(success(result, '昵称修改成功'))
}

export const updateAvatar = async (req: UserRequest, res: Response) => {
  const { avatarId } = req.body
  if (!avatarId) return res.json(fail('头像ID不能为空', 400))

  const result = await userService.updateAvatar(
    userIdFromRequest(req.user?.id),
    parseId(avatarId, '头像ID')
  )
  return res.json(success(result, '头像修改成功'))
}

export const getAvatars = async (_req: UserRequest, res: Response) => {
  const result = await userService.getAvatars()
  return res.json(success(result))
}

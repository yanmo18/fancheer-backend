/**
 * 用户控制器
 * 
 * 作用：处理用户相关请求（修改昵称/修改头像/获取头像池）
 *       接收请求参数、调用服务层、返回响应
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success, fail } from '../utils/response'
import { validateNickname } from '../utils/validate'
import userService from '../services/user.service'

export const updateNickname = async (req: UserRequest, res: Response) => {
  const userId = req.user?.id
  const { nickname } = req.body

  const error = validateNickname(nickname)
  if (error) return res.json(fail(error, 400))

  const result = await userService.updateNickname(userId!, nickname)
  return res.json(success(result, '昵称修改成功'))
}

export const updateAvatar = async (req: UserRequest, res: Response) => {
  const userId = req.user?.id
  const { avatarId } = req.body

  if (!avatarId) return res.json(fail('头像ID不能为空', 400))

  const result = await userService.updateAvatar(userId!, avatarId)
  return res.json(success(result, '头像修改成功'))
}

export const getAvatars = async (req: UserRequest, res: Response) => {
  const result = await userService.getAvatars()
  return res.json(success(result))
}

export const getPrivateReplies = async (req: UserRequest, res: Response) => {
  const userId = req.user?.id
  const { page = 1, pageSize = 20 } = req.query

  const result = await userService.getPrivateReplies(userId!, Number(page), Number(pageSize))
  return res.json(success(result))
}
/**
 * 认证控制器
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success, fail } from '../utils/response'
import { validateUsername, validatePassword } from '../utils/validate'
import { parseOptionalId, userIdFromRequest } from '../utils/id'
import authService from '../services/auth.service'

export const getCaptcha = async (_req: UserRequest, res: Response) => {
  const result = await authService.getCaptcha()
  return res.json(success(result))
}

export const getRegisterAvatars = async (_req: UserRequest, res: Response) => {
  const result = await authService.getRegisterAvatars()
  return res.json(success(result))
}

export const register = async (req: UserRequest, res: Response) => {
  const { username, password, captchaId, captchaText, agreement, avatarId } = req.body

  if (!agreement) return res.json(fail('请勾选用户协议', 400))

  const usernameError = validateUsername(username)
  if (usernameError) return res.json(fail(usernameError, 400))

  const passwordError = validatePassword(password)
  if (passwordError) return res.json(fail(passwordError, 400))

  const result = await authService.register({
    username,
    password,
    captchaId,
    captchaText,
    avatarId: parseOptionalId(avatarId)
  })
  return res.json(success(result, '注册成功'))
}

export const login = async (req: UserRequest, res: Response) => {
  const { username, password } = req.body

  const usernameError = validateUsername(username)
  if (usernameError) return res.json(fail(usernameError, 400))

  const passwordError = validatePassword(password)
  if (passwordError) return res.json(fail(passwordError, 400))

  const result = await authService.login({ username, password })
  return res.json(success(result, '登录成功'))
}

export const logout = async (req: UserRequest, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.json(fail('Token不能为空', 400))

  await authService.logout(token)
  return res.json(success(null, '登出成功'))
}

export const getMe = async (req: UserRequest, res: Response) => {
  const result = await authService.getMe(userIdFromRequest(req.user?.id))
  return res.json(success(result))
}

/**
 * 认证控制器
 * 
 * 作用：处理认证相关请求（验证码/注册/登录/登出/获取用户信息）
 *       接收请求参数、调用服务层、返回响应
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success, fail } from '../utils/response'
import { validateUsername, validatePassword } from '../utils/validate'
import authService from '../services/auth.service'

export const getCaptcha = async (req: UserRequest, res: Response) => {
  const result = await authService.getCaptcha()
  return res.json(success(result))
}

export const register = async (req: UserRequest, res: Response) => {
  const { username, password, captchaId, captchaText, agreement } = req.body

  if (!agreement) return res.json(fail('请勾选用户协议', 400))
  
  const usernameError = validateUsername(username)
  if (usernameError) return res.json(fail(usernameError, 400))
  
  const passwordError = validatePassword(password)
  if (passwordError) return res.json(fail(passwordError, 400))

  const result = await authService.register({ username, password, captchaId, captchaText })
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
  const userId = req.user?.id
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  await authService.logout(userId!, token!)
  return res.json(success(null, '登出成功'))
}

export const getMe = async (req: UserRequest, res: Response) => {
  const userId = req.user?.id
  const result = await authService.getMe(userId!)
  return res.json(success(result))
}
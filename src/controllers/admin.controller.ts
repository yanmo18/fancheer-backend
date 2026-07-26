/**
 * 管理后台控制器
 * 
 * 作用：处理管理后台相关请求（用户管理/消息管理/头像池管理/敏感词管理/操作日志）
 *       接收请求参数、调用服务层、返回响应
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success, fail } from '../utils/response'
import adminService from '../services/admin.service'

export const getUsers = async (req: UserRequest, res: Response) => {
  const { page = 1, pageSize = 20, role, status, keyword } = req.query
  const result = await adminService.getUsers(Number(page), Number(pageSize), role as string, status as string, keyword as string)
  return res.json(success(result))
}

export const banUser = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const adminId = req.user?.id

  await adminService.banUser(Number(id), adminId!)
  return res.json(success(null, '用户已封禁'))
}

export const unbanUser = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const adminId = req.user?.id

  await adminService.unbanUser(Number(id), adminId!)
  return res.json(success(null, '用户已解封'))
}

export const getPublicMessages = async (req: UserRequest, res: Response) => {
  const { page = 1, pageSize = 20, keyword } = req.query
  const result = await adminService.getPublicMessages(Number(page), Number(pageSize), keyword as string)
  return res.json(success(result))
}

export const getPrivateMessages = async (req: UserRequest, res: Response) => {
  const { page = 1, pageSize = 20, userId } = req.query
  const result = await adminService.getPrivateMessages(Number(page), Number(pageSize), userId ? Number(userId) : undefined)
  return res.json(success(result))
}

export const deleteMessage = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const adminId = req.user?.id

  await adminService.deleteMessage(Number(id), adminId!)
  return res.json(success(null, '消息已删除'))
}

export const getAvatars = async (req: UserRequest, res: Response) => {
  const { page = 1, pageSize = 20 } = req.query
  const result = await adminService.getAvatars(Number(page), Number(pageSize))
  return res.json(success(result))
}

export const createAvatar = async (req: UserRequest, res: Response) => {
  const { url, sortOrder = 0 } = req.body
  const adminId = req.user?.id

  if (!url) return res.json(fail('头像URL不能为空', 400))

  const result = await adminService.createAvatar(url, Number(sortOrder), adminId!)
  return res.json(success(result, '头像添加成功'))
}

export const deleteAvatar = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const adminId = req.user?.id

  await adminService.deleteAvatar(Number(id), adminId!)
  return res.json(success(null, '头像删除成功'))
}

export const getSensitiveWords = async (req: UserRequest, res: Response) => {
  const { page = 1, pageSize = 20 } = req.query
  const result = await adminService.getSensitiveWords(Number(page), Number(pageSize))
  return res.json(success(result))
}

export const createSensitiveWord = async (req: UserRequest, res: Response) => {
  const { word } = req.body
  const adminId = req.user?.id

  if (!word) return res.json(fail('敏感词不能为空', 400))

  const result = await adminService.createSensitiveWord(word, adminId!)
  return res.json(success(result, '敏感词添加成功'))
}

export const deleteSensitiveWord = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const adminId = req.user?.id

  await adminService.deleteSensitiveWord(Number(id), adminId!)
  return res.json(success(null, '敏感词删除成功'))
}

export const getLogs = async (req: UserRequest, res: Response) => {
  const { page = 1, pageSize = 20 } = req.query
  const result = await adminService.getLogs(Number(page), Number(pageSize))
  return res.json(success(result))
}
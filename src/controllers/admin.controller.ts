/**
 * 管理后台控制器
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success, fail } from '../utils/response'
import { sanitize } from '../utils/sanitize'
import { parseId, parseOptionalId, userIdFromRequest } from '../utils/id'
import { parsePagination } from '../utils/pagination'
import adminService from '../services/admin.service'

export const getUsers = async (req: UserRequest, res: Response) => {
  const { role, status, keyword } = req.query
  const { page, pageSize } = parsePagination(req.query.page, req.query.pageSize)
  const result = await adminService.getUsers(page, pageSize, role as string, status as string, sanitize(keyword as string))
  return res.json(success(result))
}

export const banUser = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const { remark } = req.body
  await adminService.banUser(parseId(id), userIdFromRequest(req.user?.id), sanitize(remark))
  return res.json(success(null, '用户已封禁'))
}

export const unbanUser = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  await adminService.unbanUser(parseId(id), userIdFromRequest(req.user?.id))
  return res.json(success(null, '用户已解封'))
}

export const getPublicMessages = async (req: UserRequest, res: Response) => {
  const { keyword } = req.query
  const { page, pageSize } = parsePagination(req.query.page, req.query.pageSize)
  const result = await adminService.getPublicMessages(page, pageSize, sanitize(keyword as string))
  return res.json(success(result))
}

export const getPrivateMessages = async (req: UserRequest, res: Response) => {
  const { userId } = req.query
  const { page, pageSize } = parsePagination(req.query.page, req.query.pageSize)
  const result = await adminService.getPrivateMessages(
    page,
    pageSize,
    parseOptionalId(userId as string)
  )
  return res.json(success(result))
}

export const deleteMessage = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  await adminService.deleteMessage(parseId(id), userIdFromRequest(req.user?.id))
  return res.json(success(null, '消息已删除'))
}

export const getAvatars = async (req: UserRequest, res: Response) => {
  const { page, pageSize } = parsePagination(req.query.page, req.query.pageSize)
  const result = await adminService.getAvatars(page, pageSize)
  return res.json(success(result))
}

export const createAvatar = async (req: UserRequest, res: Response) => {
  const { url, sortOrder = 0 } = req.body
  if (!url) return res.json(fail('头像URL不能为空', 400))

  const result = await adminService.createAvatar(sanitize(url), Number(sortOrder), userIdFromRequest(req.user?.id))
  return res.json(success(result, '头像添加成功'))
}

export const deleteAvatar = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  await adminService.deleteAvatar(parseId(id), userIdFromRequest(req.user?.id))
  return res.json(success(null, '头像删除成功'))
}

export const getSensitiveWords = async (req: UserRequest, res: Response) => {
  const { page, pageSize } = parsePagination(req.query.page, req.query.pageSize)
  const result = await adminService.getSensitiveWords(page, pageSize)
  return res.json(success(result))
}

export const createSensitiveWord = async (req: UserRequest, res: Response) => {
  const { word } = req.body
  if (!word) return res.json(fail('敏感词不能为空', 400))

  const result = await adminService.createSensitiveWord(sanitize(word), userIdFromRequest(req.user?.id))
  return res.json(success(result, '敏感词添加成功'))
}

export const deleteSensitiveWord = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  await adminService.deleteSensitiveWord(parseId(id), userIdFromRequest(req.user?.id))
  return res.json(success(null, '敏感词删除成功'))
}

export const getLogs = async (req: UserRequest, res: Response) => {
  const { page, pageSize } = parsePagination(req.query.page, req.query.pageSize)
  const { action, keyword, operator, startDate, endDate } = req.query
  const result = await adminService.getLogs(page, pageSize, {
    action: typeof action === 'string' ? action : undefined,
    keyword: typeof keyword === 'string' ? keyword : undefined,
    operator: typeof operator === 'string' ? operator : undefined,
    startDate: typeof startDate === 'string' ? startDate : undefined,
    endDate: typeof endDate === 'string' ? endDate : undefined
  })
  return res.json(success(result))
}

export const updateUserRole = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const { role } = req.body

  if (!role || !['admin', 'fan'].includes(role)) {
    return res.json(fail('role 参数无效，仅允许 admin 或 fan', 400))
  }

  const result = await adminService.updateUserRole(
    parseId(id, '用户ID'),
    sanitize(role),
    userIdFromRequest(req.user?.id)
  )
  return res.json(success(result, 'success'))
}

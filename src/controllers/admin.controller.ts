/**
 * 管理后台控制器
 * 
 * 作用：处理管理后台相关请求（用户管理/操作日志）
 *       接收请求参数、调用服务层、返回响应
 */

import { Request, Response } from 'express'
import { success, fail } from '../utils/response'
import adminService from '../services/admin.service'

export const getUsers = async (req: Request, res: Response) => {
  const { page = 1, pageSize = 20, role, status } = req.query
  const result = await adminService.getUsers(Number(page), Number(pageSize), role as string, status as string)
  return res.json(success(result))
}

export const updateUserStatus = async (req: Request, res: Response) => {
  const { id } = req.params
  const { status } = req.body

  if (!status) return res.json(fail('状态不能为空', 400))

  await adminService.updateUserStatus(Number(id), status)
  return res.json(success(null, '用户状态更新成功'))
}

export const getLogs = async (req: Request, res: Response) => {
  const { page = 1, pageSize = 20 } = req.query
  const result = await adminService.getLogs(Number(page), Number(pageSize))
  return res.json(success(result))
}
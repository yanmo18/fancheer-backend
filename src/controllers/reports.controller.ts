/**
 * 举报工单控制器
 * 
 * 作用：处理举报工单相关请求（提交举报/处理举报）
 *       接收请求参数、调用服务层、返回响应
 */

import { Request, Response } from 'express'
import { success, fail } from '../utils/response'
import reportsService from '../services/reports.service'

export const createReport = async (req: Request, res: Response) => {
  const userId = req.user?.id
  const { messageId, reason } = req.body

  if (!messageId) return res.json(fail('举报消息ID不能为空', 400))
  if (!reason) return res.json(fail('举报原因不能为空', 400))

  const result = await reportsService.createReport(userId!, Number(messageId), reason)
  return res.json(success(result, '举报提交成功'))
}

export const getReports = async (req: Request, res: Response) => {
  const { page = 1, pageSize = 20, status } = req.query
  const result = await reportsService.getReports(Number(page), Number(pageSize), status as string)
  return res.json(success(result))
}

export const handleReport = async (req: Request, res: Response) => {
  const { id } = req.params
  const { status, remark } = req.body

  if (!status) return res.json(fail('处理状态不能为空', 400))

  await reportsService.handleReport(Number(id), status, remark)
  return res.json(success(null, '举报处理成功'))
}
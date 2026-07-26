/**
 * 举报工单控制器
 * 
 * 作用：处理举报工单相关请求（后台管理）
 *       接收请求参数、调用服务层、返回响应
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success, fail } from '../utils/response'
import reportsService from '../services/reports.service'

export const getPendingReports = async (req: UserRequest, res: Response) => {
  const { page = 1, pageSize = 20 } = req.query
  const result = await reportsService.getReports(Number(page), Number(pageSize), 'pending')
  return res.json(success(result))
}

export const getResolvedReports = async (req: UserRequest, res: Response) => {
  const { page = 1, pageSize = 20 } = req.query
  const result = await reportsService.getReports(Number(page), Number(pageSize), 'resolved')
  return res.json(success(result))
}

export const getReportDetail = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const result = await reportsService.getReportDetail(Number(id))
  return res.json(success(result))
}

export const resolveReport = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const adminId = req.user?.id

  await reportsService.resolveReport(Number(id), adminId!)
  return res.json(success(null, '工单已办结'))
}

export const deleteViolationMessage = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const adminId = req.user?.id

  await reportsService.deleteViolationMessage(Number(id), adminId!)
  return res.json(success(null, '违规消息已删除'))
}
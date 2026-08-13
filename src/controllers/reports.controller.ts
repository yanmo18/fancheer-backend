/**
 * 举报工单控制器
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success } from '../utils/response'
import { parseId, userIdFromRequest } from '../utils/id'
import { parsePagination } from '../utils/pagination'
import reportsService from '../services/reports.service'

export const getPendingReports = async (req: UserRequest, res: Response) => {
  const { page, pageSize } = parsePagination(req.query.page, req.query.pageSize)
  const result = await reportsService.getReports(page, pageSize, 'pending')
  return res.json(success(result))
}

export const getResolvedReports = async (req: UserRequest, res: Response) => {
  const { page, pageSize } = parsePagination(req.query.page, req.query.pageSize)
  const result = await reportsService.getReports(page, pageSize, 'resolved')
  return res.json(success(result))
}

export const getReportDetail = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const result = await reportsService.getReportDetail(parseId(id))
  return res.json(success(result))
}

export const resolveReport = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  await reportsService.resolveReport(parseId(id), userIdFromRequest(req.user?.id))
  return res.json(success(null, '工单已办结'))
}

export const deleteViolationMessage = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  await reportsService.deleteViolationMessage(parseId(id), userIdFromRequest(req.user?.id))
  return res.json(success(null, '违规消息已删除'))
}

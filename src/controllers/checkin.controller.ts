/**
 * 打卡控制器
 * 
 * 作用：处理打卡相关请求（打卡/打卡日历）
 *       接收请求参数、调用服务层、返回响应
 */

import { Request, Response } from 'express'
import { success, fail } from '../utils/response'
import checkinService from '../services/checkin.service'

export const checkin = async (req: Request, res: Response) => {
  const userId = req.user?.id
  const result = await checkinService.checkin(userId!)
  return res.json(success(result))
}

export const getCheckinCalendar = async (req: Request, res: Response) => {
  const userId = req.user?.id
  const { year, month } = req.query
  const result = await checkinService.getCheckinCalendar(userId!, Number(year), Number(month))
  return res.json(success(result))
}
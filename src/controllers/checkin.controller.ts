/**
 * 打卡控制器
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success, fail } from '../utils/response'
import { validateYearMonth } from '../utils/validate'
import { userIdFromRequest } from '../utils/id'
import checkinService from '../services/checkin.service'

export const checkin = async (req: UserRequest, res: Response) => {
  const result = await checkinService.checkin(userIdFromRequest(req.user?.id))
  return res.json(success(result))
}

export const getCheckinCalendar = async (req: UserRequest, res: Response) => {
  const { year, month } = req.query
  const yearNum = Number(year)
  const monthNum = Number(month)
  const error = validateYearMonth(yearNum, monthNum)
  if (error) return res.json(fail(error, 400))

  const result = await checkinService.getCheckinCalendar(
    userIdFromRequest(req.user?.id),
    yearNum,
    monthNum
  )
  return res.json(success(result))
}

/**
 * 活动日历控制器
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success, fail } from '../utils/response'
import { sanitize } from '../utils/sanitize'
import { parseId, userIdFromRequest } from '../utils/id'
import { parsePagination } from '../utils/pagination'
import { getSensitiveWordError } from '../utils/sensitiveWord'
import activitiesService from '../services/activities.service'

export const getActivities = async (_req: UserRequest, res: Response) => {
  const result = await activitiesService.getActivities()
  return res.json(success(result))
}

export const getAdminActivities = async (req: UserRequest, res: Response) => {
  const { page, pageSize } = parsePagination(req.query.page, req.query.pageSize)
  const result = await activitiesService.getAdminActivities(page, pageSize)
  return res.json(success(result))
}

export const createActivity = async (req: UserRequest, res: Response) => {
  const { title, description, coverUrl, startTime, endTime, sortOrder = 0 } = req.body
  if (!title) return res.json(fail('活动标题不能为空', 400))
  if (!startTime) return res.json(fail('活动开始时间不能为空', 400))

  const safeTitle = sanitize(title)
  const safeDescription = sanitize(description)
  const sensitiveError = getSensitiveWordError(safeTitle, safeDescription)
  if (sensitiveError) return res.json(fail(sensitiveError, 400))

  const result = await activitiesService.createActivity({
    title: safeTitle,
    description: safeDescription,
    coverUrl,
    startTime,
    endTime,
    sortOrder
  }, userIdFromRequest(req.user?.id))
  return res.json(success(result, '活动创建成功'))
}

export const updateActivity = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const { title, description, coverUrl, startTime, endTime, sortOrder } = req.body

  const safeTitle = title !== undefined ? sanitize(title) : undefined
  const safeDescription = description !== undefined ? sanitize(description) : undefined
  const sensitiveError = getSensitiveWordError(safeTitle, safeDescription)
  if (sensitiveError) return res.json(fail(sensitiveError, 400))

  await activitiesService.updateActivity(parseId(id), {
    title: safeTitle,
    description: safeDescription,
    coverUrl,
    startTime,
    endTime,
    sortOrder
  }, userIdFromRequest(req.user?.id))
  return res.json(success(null, '活动更新成功'))
}

export const deleteActivity = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  await activitiesService.deleteActivity(parseId(id), userIdFromRequest(req.user?.id))
  return res.json(success(null, '活动删除成功'))
}

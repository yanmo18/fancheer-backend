/**
 * 活动日历控制器
 * 
 * 作用：处理活动日历相关请求（前台获取/后台CRUD）
 *       接收请求参数、调用服务层、返回响应
 */

import { Request, Response } from 'express'
import { success, fail } from '../utils/response'
import activitiesService from '../services/activities.service'

export const getActivities = async (req: Request, res: Response) => {
  const result = await activitiesService.getActivities()
  return res.json(success(result))
}

export const getAdminActivities = async (req: Request, res: Response) => {
  const { page = 1, pageSize = 20 } = req.query
  const result = await activitiesService.getAdminActivities(Number(page), Number(pageSize))
  return res.json(success(result))
}

export const createActivity = async (req: Request, res: Response) => {
  const { title, description, activityDate, sortOrder = 0 } = req.body

  if (!title) return res.json(fail('活动标题不能为空', 400))
  if (!activityDate) return res.json(fail('活动日期不能为空', 400))

  const result = await activitiesService.createActivity({ title, description, activityDate, sortOrder })
  return res.json(success(result, '活动创建成功'))
}

export const updateActivity = async (req: Request, res: Response) => {
  const { id } = req.params
  const { title, description, activityDate, sortOrder } = req.body
  await activitiesService.updateActivity(Number(id), { title, description, activityDate, sortOrder })
  return res.json(success(null, '活动更新成功'))
}

export const deleteActivity = async (req: Request, res: Response) => {
  const { id } = req.params
  await activitiesService.deleteActivity(Number(id))
  return res.json(success(null, '活动删除成功'))
}
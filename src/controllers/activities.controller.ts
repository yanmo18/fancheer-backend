/**
 * 活动日历控制器
 * 
 * 作用：处理活动日历相关请求（前台获取/后台CRUD）
 *       接收请求参数、调用服务层、返回响应
 */
import { Response } from 'express'
import { UserRequest } from '../types'
import { success, fail } from '../utils/response'
import activitiesService from '../services/activities.service'

export const getActivities = async (req: UserRequest, res: Response) => {
  const result = await activitiesService.getActivities()
  return res.json(success(result))
}

export const getAdminActivities = async (req: UserRequest, res: Response) => {
  const { page = 1, pageSize = 20 } = req.query
  const result = await activitiesService.getAdminActivities(Number(page), Number(pageSize))
  return res.json(success(result))
}

export const createActivity = async (req: UserRequest, res: Response) => {
  const { title, description, coverUrl, startTime, endTime, sortOrder = 0 } = req.body
  const adminId = req.user?.id

  if (!title) return res.json(fail('活动标题不能为空', 400))
  if (!startTime) return res.json(fail('活动开始时间不能为空', 400))

  const result = await activitiesService.createActivity({ title, description, coverUrl, startTime, endTime, sortOrder }, adminId!)
  return res.json(success(result, '活动创建成功'))
}

export const updateActivity = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const { title, description, coverUrl, startTime, endTime, sortOrder } = req.body
  const adminId = req.user?.id

  await activitiesService.updateActivity(Number(id), { title, description, coverUrl, startTime, endTime, sortOrder }, adminId!)
  return res.json(success(null, '活动更新成功'))
}

export const deleteActivity = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const adminId = req.user?.id

  await activitiesService.deleteActivity(Number(id), adminId!)
  return res.json(success(null, '活动删除成功'))
}
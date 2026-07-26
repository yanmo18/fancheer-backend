/**
 * 获奖记录控制器
 * 
 * 作用：处理获奖记录相关请求（前台获取/后台CRUD）
 *       接收请求参数、调用服务层、返回响应
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success, fail } from '../utils/response'
import { sanitize } from '../utils/sanitize'
import awardsService from '../services/awards.service'

export const getAwards = async (req: UserRequest, res: Response) => {
  const result = await awardsService.getAwards()
  return res.json(success(result))
}

export const getAdminAwards = async (req: UserRequest, res: Response) => {
  const { page = 1, pageSize = 20 } = req.query
  const result = await awardsService.getAdminAwards(Number(page), Number(pageSize))
  return res.json(success(result))
}

export const createAward = async (req: UserRequest, res: Response) => {
  const { title, description, imageUrl, awardDate, sortOrder = 0 } = req.body
  const adminId = req.user?.id

  if (!title) return res.json(fail('奖项名称不能为空', 400))

  const result = await awardsService.createAward({ 
    title: sanitize(title), 
    description: sanitize(description), 
    imageUrl, 
    awardDate, 
    sortOrder 
  }, adminId!)
  return res.json(success(result, '获奖记录创建成功'))
}

export const updateAward = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const { title, description, imageUrl, awardDate, sortOrder } = req.body
  const adminId = req.user?.id

  await awardsService.updateAward(Number(id), { 
    title: sanitize(title), 
    description: sanitize(description), 
    imageUrl, 
    awardDate, 
    sortOrder 
  }, adminId!)
  return res.json(success(null, '获奖记录更新成功'))
}

export const deleteAward = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const adminId = req.user?.id

  await awardsService.deleteAward(Number(id), adminId!)
  return res.json(success(null, '获奖记录删除成功'))
}
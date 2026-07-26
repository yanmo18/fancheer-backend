/**
 * Banner控制器
 * 
 * 作用：处理Banner相关请求（前台获取/后台CRUD）
 *       接收请求参数、调用服务层、返回响应
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success, fail } from '../utils/response'
import bannerService from '../services/banner.service'

export const getBanners = async (req: UserRequest, res: Response) => {
  const result = await bannerService.getBanners()
  return res.json(success(result))
}

export const getAdminBanners = async (req: UserRequest, res: Response) => {
  const { page = 1, pageSize = 20 } = req.query
  const result = await bannerService.getAdminBanners(Number(page), Number(pageSize))
  return res.json(success(result))
}

export const createBanner = async (req: UserRequest, res: Response) => {
  const { title, imageUrl, linkUrl, sortOrder = 0, isVisible = true } = req.body
  const adminId = req.user?.id

  if (!imageUrl) return res.json(fail('图片URL不能为空', 400))

  const result = await bannerService.createBanner({ title, imageUrl, linkUrl, sortOrder, isVisible }, adminId!)
  return res.json(success(result, 'Banner创建成功'))
}

export const updateBanner = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const { title, imageUrl, linkUrl, sortOrder, isVisible } = req.body
  const adminId = req.user?.id

  await bannerService.updateBanner(Number(id), { title, imageUrl, linkUrl, sortOrder, isVisible }, adminId!)
  return res.json(success(null, 'Banner更新成功'))
}

export const deleteBanner = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const adminId = req.user?.id

  await bannerService.deleteBanner(Number(id), adminId!)
  return res.json(success(null, 'Banner删除成功'))
}
/**
 * Banner控制器
 * 
 * 作用：处理Banner相关请求（前台获取/后台CRUD）
 *       接收请求参数、调用服务层、返回响应
 */

import { Request, Response } from 'express'
import { success, fail } from '../utils/response'
import bannerService from '../services/banner.service'

export const getBanners = async (req: Request, res: Response) => {
  const result = await bannerService.getBanners()
  return res.json(success(result))
}

export const getAdminBanners = async (req: Request, res: Response) => {
  const { page = 1, pageSize = 20 } = req.query
  const result = await bannerService.getAdminBanners(Number(page), Number(pageSize))
  return res.json(success(result))
}

export const createBanner = async (req: Request, res: Response) => {
  const { title, imageUrl, linkUrl, sortOrder = 0, isVisible = true } = req.body

  if (!imageUrl) return res.json(fail('图片URL不能为空', 400))

  const result = await bannerService.createBanner({ title, imageUrl, linkUrl, sortOrder, isVisible })
  return res.json(success(result, 'Banner创建成功'))
}

export const updateBanner = async (req: Request, res: Response) => {
  const { id } = req.params
  const { title, imageUrl, linkUrl, sortOrder, isVisible } = req.body

  await bannerService.updateBanner(Number(id), { title, imageUrl, linkUrl, sortOrder, isVisible })
  return res.json(success(null, 'Banner更新成功'))
}

export const deleteBanner = async (req: Request, res: Response) => {
  const { id } = req.params
  await bannerService.deleteBanner(Number(id))
  return res.json(success(null, 'Banner删除成功'))
}
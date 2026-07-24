/**
 * 图集控制器
 * 
 * 作用：处理图集相关请求（二次元/三次元）
 *       接收请求参数、调用服务层、返回响应
 */

import { Request, Response } from 'express'
import { success, fail } from '../utils/response'
import galleryService from '../services/gallery.service'

export const getGallery = async (req: Request, res: Response) => {
  const { category } = req.query
  const result = await galleryService.getGallery(category as string)
  return res.json(success(result))
}

export const getAdminGallery = async (req: Request, res: Response) => {
  const { page = 1, pageSize = 20 } = req.query
  const result = await galleryService.getAdminGallery(Number(page), Number(pageSize))
  return res.json(success(result))
}

export const createGalleryImage = async (req: Request, res: Response) => {
  const { imageUrl, category, sortOrder = 0 } = req.body

  if (!imageUrl) return res.json(fail('图片URL不能为空', 400))
  if (!category) return res.json(fail('分类不能为空', 400))

  const result = await galleryService.createGalleryImage({ imageUrl, category, sortOrder })
  return res.json(success(result, '图片创建成功'))
}

export const updateGalleryImage = async (req: Request, res: Response) => {
  const { id } = req.params
  const { imageUrl, category, sortOrder } = req.body
  await galleryService.updateGalleryImage(Number(id), { imageUrl, category, sortOrder })
  return res.json(success(null, '图片更新成功'))
}

export const deleteGalleryImage = async (req: Request, res: Response) => {
  const { id } = req.params
  await galleryService.deleteGalleryImage(Number(id))
  return res.json(success(null, '图片删除成功'))
}
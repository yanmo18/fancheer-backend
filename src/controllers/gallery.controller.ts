/**
 * 图集控制器
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success, fail } from '../utils/response'
import { sanitize } from '../utils/sanitize'
import { parseId, userIdFromRequest } from '../utils/id'
import { parsePagination } from '../utils/pagination'
import galleryService from '../services/gallery.service'

export const getGallery = async (req: UserRequest, res: Response) => {
  const { category } = req.query
  const result = await galleryService.getGallery(category as string)
  return res.json(success(result))
}

export const getAdminGallery = async (req: UserRequest, res: Response) => {
  const { page, pageSize } = parsePagination(req.query.page, req.query.pageSize)
  const result = await galleryService.getAdminGallery(page, pageSize)
  return res.json(success(result))
}

export const createGalleryImage = async (req: UserRequest, res: Response) => {
  const { imageUrl, category, sortOrder = 0, title } = req.body
  if (!imageUrl) return res.json(fail('图片URL不能为空', 400))
  if (!category) return res.json(fail('分类不能为空', 400))

  const result = await galleryService.createGalleryImage({
    imageUrl,
    category,
    sortOrder,
    title: sanitize(title)
  }, userIdFromRequest(req.user?.id))
  return res.json(success(result, '图片创建成功'))
}

export const updateGalleryImage = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const { imageUrl, category, sortOrder, title } = req.body

  await galleryService.updateGalleryImage(parseId(id), {
    imageUrl,
    category,
    sortOrder,
    title: sanitize(title)
  }, userIdFromRequest(req.user?.id))
  return res.json(success(null, '图片更新成功'))
}

export const deleteGalleryImage = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  await galleryService.deleteGalleryImage(parseId(id), userIdFromRequest(req.user?.id))
  return res.json(success(null, '图片删除成功'))
}

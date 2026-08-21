/**
 * Banner控制器
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success, fail } from '../utils/response'
import { sanitize } from '../utils/sanitize'
import { parseId, userIdFromRequest } from '../utils/id'
import { parsePagination } from '../utils/pagination'
import { getSensitiveWordError } from '../utils/sensitiveWord'
import bannerService from '../services/banner.service'

export const getBanners = async (_req: UserRequest, res: Response) => {
  const result = await bannerService.getBanners()
  return res.json(success(result))
}

export const getAdminBanners = async (req: UserRequest, res: Response) => {
  const { page, pageSize } = parsePagination(req.query.page, req.query.pageSize)
  const result = await bannerService.getAdminBanners(page, pageSize)
  return res.json(success(result))
}

export const createBanner = async (req: UserRequest, res: Response) => {
  const { title, imageUrl, linkUrl, sortOrder = 0, isVisible = true } = req.body
  if (!imageUrl) return res.json(fail('图片URL不能为空', 400))

  const safeTitle = sanitize(title)
  const safeLinkUrl = sanitize(linkUrl)
  const sensitiveError = getSensitiveWordError(safeTitle, safeLinkUrl)
  if (sensitiveError) return res.json(fail(sensitiveError, 400))

  const result = await bannerService.createBanner({
    title: safeTitle,
    imageUrl,
    linkUrl: safeLinkUrl,
    sortOrder,
    isVisible
  }, userIdFromRequest(req.user?.id))
  return res.json(success(result, 'Banner创建成功'))
}

export const updateBanner = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const { title, imageUrl, linkUrl, sortOrder, isVisible } = req.body

  const safeTitle = title !== undefined ? sanitize(title) : undefined
  const safeLinkUrl = linkUrl !== undefined ? sanitize(linkUrl) : undefined
  const sensitiveError = getSensitiveWordError(safeTitle, safeLinkUrl)
  if (sensitiveError) return res.json(fail(sensitiveError, 400))

  await bannerService.updateBanner(parseId(id), {
    title: safeTitle,
    imageUrl,
    linkUrl: safeLinkUrl,
    sortOrder,
    isVisible
  }, userIdFromRequest(req.user?.id))
  return res.json(success(null, 'Banner更新成功'))
}

export const deleteBanner = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  await bannerService.deleteBanner(parseId(id), userIdFromRequest(req.user?.id))
  return res.json(success(null, 'Banner删除成功'))
}

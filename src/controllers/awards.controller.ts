/**
 * 获奖记录控制器
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success, fail } from '../utils/response'
import { sanitize } from '../utils/sanitize'
import { parseId, userIdFromRequest } from '../utils/id'
import { parsePagination } from '../utils/pagination'
import { getSensitiveWordError } from '../utils/sensitiveWord'
import awardsService from '../services/awards.service'

export const getAwards = async (_req: UserRequest, res: Response) => {
  const result = await awardsService.getAwards()
  return res.json(success(result))
}

export const getAdminAwards = async (req: UserRequest, res: Response) => {
  const { page, pageSize } = parsePagination(req.query.page, req.query.pageSize)
  const result = await awardsService.getAdminAwards(page, pageSize)
  return res.json(success(result))
}

export const createAward = async (req: UserRequest, res: Response) => {
  const { title, description, imageUrl, awardDate, sortOrder = 0 } = req.body
  if (!title) return res.json(fail('奖项名称不能为空', 400))

  const safeTitle = sanitize(title)
  const safeDescription = sanitize(description)
  const sensitiveError = getSensitiveWordError(safeTitle, safeDescription)
  if (sensitiveError) return res.json(fail(sensitiveError, 400))

  const result = await awardsService.createAward({
    title: safeTitle,
    description: safeDescription,
    imageUrl,
    awardDate,
    sortOrder
  }, userIdFromRequest(req.user?.id))
  return res.json(success(result, '获奖记录创建成功'))
}

export const updateAward = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const { title, description, imageUrl, awardDate, sortOrder } = req.body

  const safeTitle = title !== undefined ? sanitize(title) : undefined
  const safeDescription = description !== undefined ? sanitize(description) : undefined
  const sensitiveError = getSensitiveWordError(safeTitle, safeDescription)
  if (sensitiveError) return res.json(fail(sensitiveError, 400))

  await awardsService.updateAward(parseId(id), {
    title: safeTitle,
    description: safeDescription,
    imageUrl,
    awardDate,
    sortOrder
  }, userIdFromRequest(req.user?.id))
  return res.json(success(null, '获奖记录更新成功'))
}

export const deleteAward = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  await awardsService.deleteAward(parseId(id), userIdFromRequest(req.user?.id))
  return res.json(success(null, '获奖记录删除成功'))
}

/**
 * 关系图谱控制器
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success, fail } from '../utils/response'
import { sanitize } from '../utils/sanitize'
import { parseId, userIdFromRequest } from '../utils/id'
import { parsePagination } from '../utils/pagination'
import { getSensitiveWordError } from '../utils/sensitiveWord'
import graphService from '../services/graph.service'

export const getGraph = async (_req: UserRequest, res: Response) => {
  const result = await graphService.getGraph()
  return res.json(success(result))
}

export const getAdminCharacters = async (req: UserRequest, res: Response) => {
  const { page, pageSize } = parsePagination(req.query.page, req.query.pageSize)
  const result = await graphService.getAdminCharacters(page, pageSize)
  return res.json(success(result))
}

export const createCharacter = async (req: UserRequest, res: Response) => {
  const { name, avatarUrl, bio, isCenter, sortOrder } = req.body
  if (!name) return res.json(fail('人物名称不能为空', 400))

  const safeName = sanitize(name)
  const safeBio = sanitize(bio)
  const sensitiveError = getSensitiveWordError(safeName, safeBio)
  if (sensitiveError) return res.json(fail(sensitiveError, 400))

  const result = await graphService.createCharacter({
    name: safeName,
    avatarUrl,
    bio: safeBio,
    isCenter,
    sortOrder
  }, userIdFromRequest(req.user?.id))
  return res.json(success(result, '人物创建成功'))
}

export const updateCharacter = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const { name, avatarUrl, bio, isCenter, sortOrder } = req.body

  const safeName = name !== undefined ? sanitize(name) : undefined
  const safeBio = bio !== undefined ? sanitize(bio) : undefined
  const sensitiveError = getSensitiveWordError(safeName, safeBio)
  if (sensitiveError) return res.json(fail(sensitiveError, 400))

  await graphService.updateCharacter(parseId(id), {
    name: safeName,
    avatarUrl,
    bio: safeBio,
    isCenter,
    sortOrder
  }, userIdFromRequest(req.user?.id))
  return res.json(success(null, '人物更新成功'))
}

export const deleteCharacter = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  await graphService.deleteCharacter(parseId(id), userIdFromRequest(req.user?.id))
  return res.json(success(null, '人物删除成功'))
}

export const getAdminRelations = async (req: UserRequest, res: Response) => {
  const { page, pageSize } = parsePagination(req.query.page, req.query.pageSize)
  const result = await graphService.getAdminRelations(page, pageSize)
  return res.json(success(result))
}

export const createRelation = async (req: UserRequest, res: Response) => {
  const { fromCharacterId, toCharacterId, relationLabel, sortOrder } = req.body
  if (!fromCharacterId) return res.json(fail('起始人物ID不能为空', 400))
  if (!toCharacterId) return res.json(fail('目标人物ID不能为空', 400))
  if (!relationLabel) return res.json(fail('关系类型不能为空', 400))

  const safeLabel = sanitize(relationLabel)
  const sensitiveError = getSensitiveWordError(safeLabel)
  if (sensitiveError) return res.json(fail(sensitiveError, 400))

  const result = await graphService.createRelation({
    fromCharacterId: parseId(fromCharacterId, '起始人物ID'),
    toCharacterId: parseId(toCharacterId, '目标人物ID'),
    relationLabel: safeLabel,
    sortOrder
  }, userIdFromRequest(req.user?.id))
  return res.json(success(result, '关系创建成功'))
}

export const updateRelation = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const { fromCharacterId, toCharacterId, relationLabel, sortOrder } = req.body

  const safeLabel = relationLabel !== undefined ? sanitize(relationLabel) : undefined
  const sensitiveError = getSensitiveWordError(safeLabel)
  if (sensitiveError) return res.json(fail(sensitiveError, 400))

  await graphService.updateRelation(parseId(id), {
    fromCharacterId: fromCharacterId ? parseId(fromCharacterId, '起始人物ID') : undefined,
    toCharacterId: toCharacterId ? parseId(toCharacterId, '目标人物ID') : undefined,
    relationLabel: safeLabel,
    sortOrder
  }, userIdFromRequest(req.user?.id))
  return res.json(success(null, '关系更新成功'))
}

export const deleteRelation = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  await graphService.deleteRelation(parseId(id), userIdFromRequest(req.user?.id))
  return res.json(success(null, '关系删除成功'))
}

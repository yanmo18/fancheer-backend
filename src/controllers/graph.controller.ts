/**
 * 关系图谱控制器
 * 
 * 作用：处理关系图谱相关请求（人物/连线）
 *       接收请求参数、调用服务层、返回响应
 */

import { Request, Response } from 'express'
import { success, fail } from '../utils/response'
import graphService from '../services/graph.service'

export const getCharacters = async (req: Request, res: Response) => {
  const result = await graphService.getCharacters()
  return res.json(success(result))
}

export const getRelations = async (req: Request, res: Response) => {
  const result = await graphService.getRelations()
  return res.json(success(result))
}

export const getAdminCharacters = async (req: Request, res: Response) => {
  const { page = 1, pageSize = 20 } = req.query
  const result = await graphService.getAdminCharacters(Number(page), Number(pageSize))
  return res.json(success(result))
}

export const createCharacter = async (req: Request, res: Response) => {
  const { name, avatarUrl, description, x, y } = req.body

  if (!name) return res.json(fail('人物名称不能为空', 400))

  const result = await graphService.createCharacter({ name, avatarUrl, description, x, y })
  return res.json(success(result, '人物创建成功'))
}

export const updateCharacter = async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, avatarUrl, description, x, y } = req.body
  await graphService.updateCharacter(Number(id), { name, avatarUrl, description, x, y })
  return res.json(success(null, '人物更新成功'))
}

export const deleteCharacter = async (req: Request, res: Response) => {
  const { id } = req.params
  await graphService.deleteCharacter(Number(id))
  return res.json(success(null, '人物删除成功'))
}

export const getAdminRelations = async (req: Request, res: Response) => {
  const { page = 1, pageSize = 20 } = req.query
  const result = await graphService.getAdminRelations(Number(page), Number(pageSize))
  return res.json(success(result))
}

export const createRelation = async (req: Request, res: Response) => {
  const { fromCharacterId, toCharacterId, relationType } = req.body

  if (!fromCharacterId) return res.json(fail('起始人物ID不能为空', 400))
  if (!toCharacterId) return res.json(fail('目标人物ID不能为空', 400))
  if (!relationType) return res.json(fail('关系类型不能为空', 400))

  const result = await graphService.createRelation({ fromCharacterId, toCharacterId, relationType })
  return res.json(success(result, '关系创建成功'))
}

export const updateRelation = async (req: Request, res: Response) => {
  const { id } = req.params
  const { fromCharacterId, toCharacterId, relationType } = req.body
  await graphService.updateRelation(Number(id), { fromCharacterId, toCharacterId, relationType })
  return res.json(success(null, '关系更新成功'))
}

export const deleteRelation = async (req: Request, res: Response) => {
  const { id } = req.params
  await graphService.deleteRelation(Number(id))
  return res.json(success(null, '关系删除成功'))
}
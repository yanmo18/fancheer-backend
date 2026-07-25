/**
 * 关系图谱服务
 * 
 * 作用：实现关系图谱相关业务逻辑（人物/连线）
 *       与数据库交互、处理业务规则
 */

import { prisma } from '../lib/prisma'
import AppError from '../utils/appError'

export const getCharacters = async () => {
  const characters = await prisma.graph_characters.findMany({
    select: {
      id: true,
      name: true,
      avatar_url: true,
      bio: true,
      is_center: true,
      sort_order: true
    }
  })

  return characters.map(char => ({
    ...char,
    avatarUrl: char.avatar_url,
    bio: char.bio,
    isCenter: char.is_center,
    sortOrder: char.sort_order
  }))
}

export const getRelations = async () => {
  const relations = await prisma.graph_relations.findMany({
    select: {
      id: true,
      from_character_id: true,
      to_character_id: true,
      relation_label: true,
      sort_order: true
    }
  })

  return relations.map(rel => ({
    ...rel,
    fromCharacterId: rel.from_character_id,
    toCharacterId: rel.to_character_id,
    relationLabel: rel.relation_label,
    sortOrder: rel.sort_order
  }))
}

export const getAdminCharacters = async (page: number, pageSize: number) => {
  const skip = (page - 1) * pageSize
  const [list, total] = await Promise.all([
    prisma.graph_characters.findMany({
      skip,
      take: pageSize
    }),
    prisma.graph_characters.count()
  ])

  return {
    list: list.map(char => ({
      ...char,
      avatarUrl: char.avatar_url,
      isCenter: char.is_center,
      sortOrder: char.sort_order,
      createdAt: char.created_at
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}

export const createCharacter = async ({ name, avatarUrl, bio, isCenter, sortOrder }: {
  name: string
  avatarUrl?: string
  bio?: string
  isCenter?: boolean
  sortOrder?: number
}) => {
  const character = await prisma.graph_characters.create({
    data: {
      name,
      avatar_url: avatarUrl || '',
      bio: bio || '',
      is_center: isCenter !== undefined ? isCenter : false,
      sort_order: sortOrder || 0
    },
    select: { id: true }
  })

  return { id: character.id }
}

export const updateCharacter = async (id: number, { name, avatarUrl, bio, isCenter, sortOrder }: {
  name?: string
  avatarUrl?: string
  bio?: string
  isCenter?: boolean
  sortOrder?: number
}) => {
  const character = await prisma.graph_characters.findUnique({ where: { id } })
  if (!character) {
    throw new AppError('人物不存在', 404)
  }

  const updateData: Record<string, any> = {}
  if (name !== undefined) updateData.name = name
  if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl
  if (bio !== undefined) updateData.bio = bio
  if (isCenter !== undefined) updateData.is_center = isCenter
  if (sortOrder !== undefined) updateData.sort_order = sortOrder

  await prisma.graph_characters.update({
    where: { id },
    data: updateData
  })
}

export const deleteCharacter = async (id: number) => {
  const character = await prisma.graph_characters.findUnique({ where: { id } })
  if (!character) {
    throw new AppError('人物不存在', 404)
  }

  await prisma.graph_relations.deleteMany({
    where: {
      OR: [
        { from_character_id: id },
        { to_character_id: id }
      ]
    }
  })

  await prisma.graph_characters.delete({ where: { id } })
}

export const getAdminRelations = async (page: number, pageSize: number) => {
  const skip = (page - 1) * pageSize
  const [list, total] = await Promise.all([
    prisma.graph_relations.findMany({
      skip,
      take: pageSize
    }),
    prisma.graph_relations.count()
  ])

  return {
    list: list.map(rel => ({
      ...rel,
      fromCharacterId: rel.from_character_id,
      toCharacterId: rel.to_character_id,
      relationLabel: rel.relation_label,
      sortOrder: rel.sort_order,
      createdAt: rel.created_at
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}

export const createRelation = async ({ fromCharacterId, toCharacterId, relationLabel, sortOrder }: {
  fromCharacterId: number
  toCharacterId: number
  relationLabel?: string
  sortOrder?: number
}) => {
  const fromChar = await prisma.graph_characters.findUnique({ where: { id: fromCharacterId } })
  const toChar = await prisma.graph_characters.findUnique({ where: { id: toCharacterId } })

  if (!fromChar) throw new AppError('起始人物不存在', 404)
  if (!toChar) throw new AppError('目标人物不存在', 404)

  const relation = await prisma.graph_relations.create({
    data: {
      from_character_id: fromCharacterId,
      to_character_id: toCharacterId,
      relation_label: relationLabel || '',
      sort_order: sortOrder || 0
    },
    select: { id: true }
  })

  return { id: relation.id }
}

export const updateRelation = async (id: number, { fromCharacterId, toCharacterId, relationLabel, sortOrder }: {
  fromCharacterId?: number
  toCharacterId?: number
  relationLabel?: string
  sortOrder?: number
}) => {
  const relation = await prisma.graph_relations.findUnique({ where: { id } })
  if (!relation) {
    throw new AppError('关系不存在', 404)
  }

  const updateData: Record<string, any> = {}
  if (fromCharacterId !== undefined) updateData.from_character_id = fromCharacterId
  if (toCharacterId !== undefined) updateData.to_character_id = toCharacterId
  if (relationLabel !== undefined) updateData.relation_label = relationLabel
  if (sortOrder !== undefined) updateData.sort_order = sortOrder

  await prisma.graph_relations.update({
    where: { id },
    data: updateData
  })
}

export const deleteRelation = async (id: number) => {
  const relation = await prisma.graph_relations.findUnique({ where: { id } })
  if (!relation) {
    throw new AppError('关系不存在', 404)
  }

  await prisma.graph_relations.delete({ where: { id } })
}

export default {
  getCharacters,
  getRelations,
  getAdminCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  getAdminRelations,
  createRelation,
  updateRelation,
  deleteRelation
}
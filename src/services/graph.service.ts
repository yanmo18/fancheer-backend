/**
 * 关系图谱服务
 */

import { prisma } from '../lib/prisma'
import AppError from '../utils/appError'

export const getGraph = async () => {
  const [characters, relations] = await Promise.all([
    prisma.graph_characters.findMany({
      select: {
        id: true,
        name: true,
        avatar_url: true,
        bio: true,
        is_center: true,
        sort_order: true
      }
    }),
    prisma.graph_relations.findMany({
      select: {
        id: true,
        from_character_id: true,
        to_character_id: true,
        relation_label: true,
        sort_order: true
      }
    })
  ])

  return {
    characters: characters.map(char => ({
      id: char.id,
      name: char.name,
      avatarUrl: char.avatar_url || '',
      bio: char.bio || '',
      isCenter: char.is_center,
      sortOrder: char.sort_order
    })),
    relations: relations.map(rel => ({
      id: rel.id,
      fromCharacterId: rel.from_character_id,
      toCharacterId: rel.to_character_id,
      relationLabel: rel.relation_label || '',
      sortOrder: rel.sort_order
    }))
  }
}

export const getAdminCharacters = async (page: number, pageSize: number) => {
  const skip = (page - 1) * pageSize
  const [list, total] = await Promise.all([
    prisma.graph_characters.findMany({
      skip,
      take: pageSize,
      orderBy: { sort_order: 'desc' }
    }),
    prisma.graph_characters.count()
  ])

  return {
    list: list.map(char => ({
      id: char.id,
      name: char.name,
      avatarUrl: char.avatar_url,
      bio: char.bio,
      isCenter: char.is_center,
      sortOrder: char.sort_order,
      createdAt: char.created_at,
      updatedAt: char.updated_at
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
}, adminId: bigint) => {
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

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'create_graph_character',
      target_type: 'graph_character',
      target_id: character.id,
      detail: `创建图谱人物: ${name}`
    }
  })

  return { id: character.id }
}

export const updateCharacter = async (id: bigint, { name, avatarUrl, bio, isCenter, sortOrder }: {
  name?: string
  avatarUrl?: string
  bio?: string
  isCenter?: boolean
  sortOrder?: number
}, adminId: bigint) => {
  const character = await prisma.graph_characters.findUnique({ where: { id } })
  if (!character) {
    throw new AppError('人物不存在', 404)
  }

  const updateData: Record<string, unknown> = { updated_at: new Date() }
  if (name !== undefined) updateData.name = name
  if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl
  if (bio !== undefined) updateData.bio = bio
  if (isCenter !== undefined) updateData.is_center = isCenter
  if (sortOrder !== undefined) updateData.sort_order = sortOrder

  await prisma.graph_characters.update({ where: { id }, data: updateData })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'update_graph_character',
      target_type: 'graph_character',
      target_id: id,
      detail: `更新图谱人物: ${id}`
    }
  })
}

export const deleteCharacter = async (id: bigint, adminId: bigint) => {
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

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'delete_graph_character',
      target_type: 'graph_character',
      target_id: id,
      detail: `删除图谱人物: ${character.name}`
    }
  })
}

export const getAdminRelations = async (page: number, pageSize: number) => {
  const skip = (page - 1) * pageSize
  const [list, total] = await Promise.all([
    prisma.graph_relations.findMany({
      skip,
      take: pageSize,
      orderBy: { sort_order: 'desc' }
    }),
    prisma.graph_relations.count()
  ])

  return {
    list: list.map(rel => ({
      id: rel.id,
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
  fromCharacterId: bigint
  toCharacterId: bigint
  relationLabel?: string
  sortOrder?: number
}, adminId: bigint) => {
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

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'create_graph_relation',
      target_type: 'graph_relation',
      target_id: relation.id,
      detail: `创建图谱关系: ${fromCharacterId} -> ${toCharacterId}`
    }
  })

  return { id: relation.id }
}

export const updateRelation = async (id: bigint, { fromCharacterId, toCharacterId, relationLabel, sortOrder }: {
  fromCharacterId?: bigint
  toCharacterId?: bigint
  relationLabel?: string
  sortOrder?: number
}, adminId: bigint) => {
  const relation = await prisma.graph_relations.findUnique({ where: { id } })
  if (!relation) {
    throw new AppError('关系不存在', 404)
  }

  const updateData: Record<string, unknown> = {}
  if (fromCharacterId !== undefined) updateData.from_character_id = fromCharacterId
  if (toCharacterId !== undefined) updateData.to_character_id = toCharacterId
  if (relationLabel !== undefined) updateData.relation_label = relationLabel
  if (sortOrder !== undefined) updateData.sort_order = sortOrder

  await prisma.graph_relations.update({ where: { id }, data: updateData })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'update_graph_relation',
      target_type: 'graph_relation',
      target_id: id,
      detail: `更新图谱关系: ${id}`
    }
  })
}

export const deleteRelation = async (id: bigint, adminId: bigint) => {
  const relation = await prisma.graph_relations.findUnique({ where: { id } })
  if (!relation) {
    throw new AppError('关系不存在', 404)
  }

  await prisma.graph_relations.delete({ where: { id } })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'delete_graph_relation',
      target_type: 'graph_relation',
      target_id: id,
      detail: `删除图谱关系: ${id}`
    }
  })
}

export default {
  getGraph,
  getAdminCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  getAdminRelations,
  createRelation,
  updateRelation,
  deleteRelation
}

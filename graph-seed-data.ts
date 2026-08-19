import type { PrismaClient } from './generated/prisma/client'

export const GRAPH_CHARACTER_DEFS = [
  { name: 'Fancheer', avatar_url: '/assets/picture-01.jpg', bio: '博主 · 创作与音乐', is_center: true, sort_order: 1 },
  { name: 'ZHENG', avatar_url: '/assets/picture-16.jpg', bio: '伙伴 · 同频创作', is_center: false, sort_order: 2 },
  { name: '日常', avatar_url: '/assets/header.jpg', bio: '猫系分身 · 随拍记录', is_center: false, sort_order: 3 },
  { name: '阿洛', avatar_url: '/assets/picture-02.jpg', bio: '视觉设计 · 封面合作', is_center: false, sort_order: 4 },
  { name: '米娅', avatar_url: '/assets/picture-08.jpg', bio: '直播搭档 · 氛围组', is_center: false, sort_order: 5 },
  { name: '小夜', avatar_url: '/assets/picture-03.jpg', bio: '词曲创作 · 深夜灵感', is_center: false, sort_order: 6 },
  { name: '北辰', avatar_url: '/assets/picture-05.jpg', bio: '编曲同好 · 乐器搭子', is_center: false, sort_order: 7 },
  { name: '柚子', avatar_url: '/assets/picture-11.jpg', bio: '同期好友 · 互相催更', is_center: false, sort_order: 8 },
  { name: '云雀', avatar_url: '/assets/picture-06.jpg', bio: '邻居 · 线下小聚', is_center: false, sort_order: 9 },
  { name: '星野', avatar_url: '/assets/picture-10.jpg', bio: '粉丝代表 · 活动应援', is_center: false, sort_order: 10 },
] as const

export const GRAPH_RELATION_DEFS: {
  from: string
  to: string
  relation_label: string
  sort_order: number
}[] = [
  { from: 'Fancheer', to: 'ZHENG', relation_label: '伙伴', sort_order: 1 },
  { from: 'Fancheer', to: '日常', relation_label: '猫系分身', sort_order: 2 },
  { from: 'Fancheer', to: '阿洛', relation_label: '合作', sort_order: 3 },
  { from: 'Fancheer', to: '米娅', relation_label: '好友', sort_order: 4 },
  { from: 'Fancheer', to: '小夜', relation_label: '创作搭档', sort_order: 5 },
  { from: 'Fancheer', to: '北辰', relation_label: '音乐同好', sort_order: 6 },
  { from: 'Fancheer', to: '柚子', relation_label: '同期', sort_order: 7 },
  { from: 'Fancheer', to: '云雀', relation_label: '邻居', sort_order: 8 },
  { from: 'Fancheer', to: '星野', relation_label: '粉丝代表', sort_order: 9 },
  { from: '阿洛', to: '小夜', relation_label: '同事', sort_order: 10 },
  { from: '米娅', to: '柚子', relation_label: '闺蜜', sort_order: 11 },
  { from: '北辰', to: '云雀', relation_label: '乐队', sort_order: 12 },
  { from: 'ZHENG', to: '星野', relation_label: '应援', sort_order: 13 },
]

export async function seedGraphData(prisma: PrismaClient) {
  await prisma.graph_relations.deleteMany()
  await prisma.graph_characters.deleteMany()

  const idByName = new Map<string, bigint>()
  for (const def of GRAPH_CHARACTER_DEFS) {
    const character = await prisma.graph_characters.create({ data: { ...def } })
    idByName.set(character.name, character.id)
  }

  await prisma.graph_relations.createMany({
    data: GRAPH_RELATION_DEFS.map((rel) => ({
      from_character_id: idByName.get(rel.from)!,
      to_character_id: idByName.get(rel.to)!,
      relation_label: rel.relation_label,
      sort_order: rel.sort_order,
    })),
  })

  return {
    characterCount: GRAPH_CHARACTER_DEFS.length,
    relationCount: GRAPH_RELATION_DEFS.length,
  }
}

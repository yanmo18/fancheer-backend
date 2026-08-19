import { prisma } from './src/lib/prisma'

/** 刷新预设头像池（使用前端 public/assets 图片） */
async function seedAvatars() {
  console.log('🖼️ 写入预设头像池...')

  await prisma.users.updateMany({ data: { avatar_id: null } })
  await prisma.avatars.deleteMany()

  const { count } = await prisma.avatars.createMany({
    data: [
      { url: '/assets/picture-01.jpg', sort_order: 10 },
      { url: '/assets/picture-08.jpg', sort_order: 9 },
      { url: '/assets/picture-16.jpg', sort_order: 8 },
      { url: '/assets/picture-02.jpg', sort_order: 7 },
      { url: '/assets/picture-03.jpg', sort_order: 6 },
      { url: '/assets/picture-10.jpg', sort_order: 5 },
      { url: '/assets/picture-11.jpg', sort_order: 4 },
      { url: '/assets/header.jpg', sort_order: 3 },
    ],
  })

  console.log(`✅ 已写入 ${count} 个预设头像`)
  await prisma.$disconnect()
}

seedAvatars().catch(async (error) => {
  console.error('❌ 头像写入失败:', error)
  await prisma.$disconnect()
  process.exit(1)
})

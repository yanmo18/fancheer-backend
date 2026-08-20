import { prisma } from './src/lib/prisma'
import { seedUploadFiles } from './seed-uploads'

/** 刷新预设头像池（使用 uploads 静态资源） */
async function seedAvatars() {
  console.log('🖼️ 写入预设头像池...')

  seedUploadFiles()

  await prisma.users.updateMany({ data: { avatar_id: null } })
  await prisma.avatars.deleteMany()

  const { count } = await prisma.avatars.createMany({
    data: [
      { url: '/uploads/avatars/avatar-01.jpg', sort_order: 10 },
      { url: '/uploads/avatars/avatar-02.jpg', sort_order: 9 },
      { url: '/uploads/avatars/avatar-03.jpg', sort_order: 8 },
      { url: '/uploads/avatars/avatar-04.jpg', sort_order: 7 },
      { url: '/uploads/avatars/avatar-05.jpg', sort_order: 6 },
      { url: '/uploads/avatars/avatar-06.jpg', sort_order: 5 },
      { url: '/uploads/avatars/avatar-07.jpg', sort_order: 4 },
      { url: '/uploads/avatars/avatar-08.jpg', sort_order: 3 },
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

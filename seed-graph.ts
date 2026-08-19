import { prisma } from './src/lib/prisma'
import { seedGraphData } from './graph-seed-data'

/** 仅刷新关系图谱，不影响其他数据 */
async function main() {
  console.log('🔗 写入关系图谱数据...')
  const { characterCount, relationCount } = await seedGraphData(prisma)
  console.log(`✅ 已写入 ${characterCount} 个人物、${relationCount} 条关系`)
  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error('❌ 关系图谱写入失败:', error)
  await prisma.$disconnect()
  process.exit(1)
})

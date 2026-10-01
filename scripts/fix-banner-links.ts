/**
 * 将首页 Banner 纠正为可预期的点击行为（不整库 seed）。
 * - 欢迎：清空 link，点击仅全屏放大
 * - 活动：link=/activities
 * - 单曲：link=#home-music（滚到首页音乐区，避免 /songs 404）
 */
import { prisma } from '../src/lib/prisma'

async function main() {
  const rows = await prisma.banners.findMany({ orderBy: { sort_order: 'asc' } })
  console.log('before:')
  for (const row of rows) {
    console.log(`  id=${row.id} title=${row.title} link=${row.link_url}`)
  }

  for (const row of rows) {
    const title = row.title || ''
    let link = row.link_url || ''

    if (/欢迎|个人站|Fancheer/i.test(title) && !/活动|单曲|音乐/.test(title)) {
      link = ''
    } else if (/活动|日历|日程/.test(title)) {
      link = '/activities'
    } else if (/单曲|音乐|歌曲|新歌/.test(title) || link === '/songs' || link.startsWith('/songs')) {
      link = '#home-music'
    } else if (link === '/') {
      link = ''
    }

    if (link !== (row.link_url || '')) {
      await prisma.banners.update({ where: { id: row.id }, data: { link_url: link } })
      console.log(`updated id=${row.id} -> link="${link}"`)
    }
  }

  const after = await prisma.banners.findMany({ orderBy: { sort_order: 'asc' } })
  console.log('after:')
  for (const row of after) {
    console.log(`  id=${row.id} title=${row.title} link=${row.link_url}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

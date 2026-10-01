/**
 * 修复图集：URL 指向不存在文件的记录，尽量映射回 uploads/gallery 下已有种子图。
 * 用法：pnpm exec tsx scripts/repair-gallery-urls.ts
 */
import fs from 'fs'
import path from 'path'
import { prisma } from '../src/lib/prisma'
import { UPLOADS_DIR } from '../src/config/paths'

const REAL_SEED = [
  { url: '/uploads/gallery/real-01.jpg', title: '日常随拍', sort_order: 6 },
  { url: '/uploads/gallery/real-02.jpg', title: '午后时光', sort_order: 5 },
  { url: '/uploads/gallery/real-03.jpg', title: '街拍记录', sort_order: 4 },
  { url: '/uploads/gallery/real-04.jpg', title: '舞台幕后', sort_order: 3 },
  { url: '/uploads/gallery/real-05.jpg', title: '旅行片段', sort_order: 2 },
  { url: '/uploads/gallery/real-06.jpg', title: '光影瞬间', sort_order: 1 },
]

function localPathFromUrl(url: string) {
  if (!url.startsWith('/uploads/')) return null
  const relative = url.slice('/uploads/'.length)
  if (!relative || relative.includes('..')) return null
  return path.join(UPLOADS_DIR, relative)
}

function fileExists(url: string) {
  const filePath = localPathFromUrl(url)
  return Boolean(filePath && fs.existsSync(filePath))
}

async function main() {
  const rows = await prisma.gallery_images.findMany({ orderBy: { id: 'asc' } })
  let fixed = 0

  for (const row of rows) {
    if (fileExists(row.url)) continue
    console.log(`[missing] id=${row.id} category=${row.category} url=${row.url}`)

    if (row.category === 'real') {
      const unused = REAL_SEED.find(
        (seed) =>
          fileExists(seed.url) &&
          !rows.some((r) => r.id !== row.id && r.url === seed.url),
      )
      if (unused) {
        await prisma.gallery_images.update({
          where: { id: row.id },
          data: { url: unused.url, title: row.title || unused.title },
        })
        console.log(`  -> repaired to ${unused.url}`)
        fixed += 1
        row.url = unused.url
        continue
      }
    }

    await prisma.gallery_images.delete({ where: { id: row.id } })
    console.log('  -> deleted (no replacement file)')
    fixed += 1
  }

  const realCount = await prisma.gallery_images.count({ where: { category: 'real' } })
  if (realCount === 0) {
    await prisma.gallery_images.createMany({
      data: REAL_SEED.filter((s) => fileExists(s.url)).map((s) => ({
        category: 'real' as const,
        url: s.url,
        title: s.title,
        sort_order: s.sort_order,
      })),
    })
    console.log('inserted seed real gallery rows')
  } else {
    const existingUrls = new Set(
      (await prisma.gallery_images.findMany({ where: { category: 'real' }, select: { url: true } })).map(
        (r) => r.url,
      ),
    )
    const toAdd = REAL_SEED.filter((s) => fileExists(s.url) && !existingUrls.has(s.url))
    if (toAdd.length) {
      await prisma.gallery_images.createMany({
        data: toAdd.map((s) => ({
          category: 'real' as const,
          url: s.url,
          title: s.title,
          sort_order: s.sort_order,
        })),
      })
      console.log(`added ${toAdd.length} missing real seed images`)
    }
  }

  const summary = await prisma.gallery_images.groupBy({
    by: ['category'],
    _count: true,
  })
  console.log('done. fixedOps≈', fixed, 'counts=', summary)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

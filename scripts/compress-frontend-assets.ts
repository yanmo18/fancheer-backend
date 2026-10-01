import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { FRONTEND_ASSETS_CANDIDATES } from '../seed-upload-manifest'
import { writeCompressedJpeg } from '../src/utils/compressImage'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SKIP_IF_UNDER_BYTES = 600 * 1024

function resolveAssetsDir(): string | null {
  return FRONTEND_ASSETS_CANDIDATES
    .map((dir) => path.resolve(ROOT, dir))
    .find((dir) => fs.existsSync(path.join(dir, 'header.jpg'))) ?? null
}

async function main() {
  const assetsDir = resolveAssetsDir()
  if (!assetsDir) {
    console.error('❌ 未找到前端素材目录 public/assets 或 pub/assets')
    process.exit(1)
  }

  const files = fs.readdirSync(assetsDir).filter((name) => /\.(jpe?g)$/i.test(name))
  if (!files.length) {
    console.warn('⚠️ 目录内没有 jpg')
    return
  }

  console.log(`🖼 压缩前端演示图: ${assetsDir}`)
  let compressed = 0
  let skipped = 0

  for (const name of files) {
    const filePath = path.join(assetsDir, name)
    const before = fs.statSync(filePath).size
    if (before <= SKIP_IF_UNDER_BYTES) {
      skipped += 1
      continue
    }
    await writeCompressedJpeg(filePath, filePath)
    const after = fs.statSync(filePath).size
    console.log(`   ${name}: ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB`)
    compressed += 1
  }

  console.log(`✅ 已压缩 ${compressed} 张，跳过 ${skipped} 张（已小于 600KB）`)
}

main().catch((error) => {
  console.error('❌ 压缩失败:', error)
  process.exit(1)
})

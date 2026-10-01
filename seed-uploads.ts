import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  FRONTEND_ASSETS_CANDIDATES,
  SEED_ASSETS_DIR,
  UPLOAD_AUDIO_FILES,
  UPLOAD_IMAGE_COPIES,
} from './seed-upload-manifest'
import { writeCompressedJpeg } from './src/utils/compressImage'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_UPLOADS_DIR = path.join(ROOT, 'uploads')

/** 1x1 占位 JPEG 远小于真实封面 */
const PLACEHOLDER_MAX_BYTES = 2048
/** 超过该体积视为未压缩原图，自动再压一次 */
const OVERSIZE_BYTES = 1.5 * 1024 * 1024

function uploadsRoot(override?: string) {
  return override ?? DEFAULT_UPLOADS_DIR
}

function resolveAssetsDir(): string | null {
  const candidates = [
    ...FRONTEND_ASSETS_CANDIDATES.map((dir) => path.resolve(ROOT, dir)),
    path.resolve(ROOT, SEED_ASSETS_DIR),
  ]
  return candidates.find((dir) => fs.existsSync(path.join(dir, 'header.jpg'))) ?? null
}

function uploadsAlreadySeeded(dir: string): boolean {
  return fs.existsSync(path.join(dir, 'banners', 'banner1.jpg'))
}

function isTinyPlaceholder(filePath: string): boolean {
  try {
    return fs.statSync(filePath).size <= PLACEHOLDER_MAX_BYTES
  } catch {
    return true
  }
}

/** 极短静音 MP3，避免种子数据音频 404 */
const SILENT_MP3 = Buffer.from(
  '/+MYxAAAAANIAAAAAExBTUUzLjk4LjIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'base64',
)

/** 1x1 深灰 JPEG，无素材目录时的兜底占位图 */
const PLACEHOLDER_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=',
  'base64',
)

function ensureDir(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function isOversized(filePath: string): boolean {
  try {
    return fs.statSync(filePath).size > OVERSIZE_BYTES
  } catch {
    return true
  }
}

async function copyAsset(assetsDir: string, destRoot: string, relativeSrc: string, relativeDest: string) {
  const from = path.join(assetsDir, relativeSrc)
  const to = path.join(destRoot, relativeDest)
  ensureDir(to)

  const source = fs.existsSync(from)
    ? from
    : fs.existsSync(path.join(assetsDir, 'header.jpg'))
      ? path.join(assetsDir, 'header.jpg')
      : null

  if (!source) {
    fs.writeFileSync(to, PLACEHOLDER_JPEG)
    console.warn(`⚠️ 素材缺失 ${relativeSrc}，已写入占位图 → ${relativeDest}`)
    return
  }

  if (source !== from) {
    console.warn(`⚠️ 素材缺失 ${relativeSrc}，已用 header.jpg 占位 → ${relativeDest}`)
  }

  try {
    await writeCompressedJpeg(source, to)
  } catch {
    fs.copyFileSync(source, to)
    console.warn(`⚠️ 压缩失败，已原样复制 → ${relativeDest}`)
  }
}

function writePlaceholder(destPath: string) {
  ensureDir(destPath)
  fs.writeFileSync(destPath, PLACEHOLDER_JPEG)
}

export async function seedUploadFiles(options?: { force?: boolean; uploadsDir?: string }) {
  const force = options?.force === true
  const destRoot = uploadsRoot(options?.uploadsDir)
  const marker = path.join(destRoot, 'banners', 'banner1.jpg')
  const assetsDirForHeal = resolveAssetsDir()
  if (uploadsAlreadySeeded(destRoot) && !force) {
    const shouldHeal = Boolean(assetsDirForHeal) && (isTinyPlaceholder(marker) || isOversized(marker))
    if (!shouldHeal) {
      return 0
    }
  }

  let copied = 0
  const assetsDir = resolveAssetsDir()
  if (!assetsDir) {
    console.warn('⚠️ 未找到 uploads 素材目录，将写入占位图与静音音频')
    fs.mkdirSync(path.join(destRoot, 'banners'), { recursive: true })
    for (const item of UPLOAD_IMAGE_COPIES) {
      writePlaceholder(path.join(destRoot, item.dest))
      copied += 1
      if (item.legacyDest) {
        writePlaceholder(path.join(destRoot, item.legacyDest))
        copied += 1
      }
    }
    for (const relativeDest of UPLOAD_AUDIO_FILES) {
      const to = path.join(destRoot, relativeDest)
      ensureDir(to)
      fs.writeFileSync(to, SILENT_MP3)
      copied += 1
    }
    return copied
  }

  const jobs: Array<{ src: string; dest: string }> = []
  for (const item of UPLOAD_IMAGE_COPIES) {
    jobs.push({ src: item.src, dest: item.dest })
    if (item.legacyDest) jobs.push({ src: item.src, dest: item.legacyDest })
  }

  const concurrency = 4
  let cursor = 0
  async function worker() {
    while (cursor < jobs.length) {
      const index = cursor
      cursor += 1
      const job = jobs[index]
      await copyAsset(assetsDir, destRoot, job.src, job.dest)
      copied += 1
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()))

  for (const relativeDest of UPLOAD_AUDIO_FILES) {
    const to = path.join(destRoot, relativeDest)
    ensureDir(to)
    fs.writeFileSync(to, SILENT_MP3)
    copied += 1
  }

  return copied
}

async function main() {
  const force = process.argv.includes('--force')
  console.log('📁 开始生成 uploads 种子文件...')
  const assetsDir = resolveAssetsDir()
  const destRoot = uploadsRoot()
  console.log(`   素材来源: ${assetsDir ?? '(无真实素材，将写占位图)'}`)
  console.log(`   输出目录: ${destRoot}`)
  if (force) console.log('   模式: --force 覆盖已有文件')

  const count = await seedUploadFiles({ force })

  console.log(`✅ 已写入 ${count} 个 uploads 文件`)
}

const entryScript = process.argv[1] ? path.resolve(process.argv[1]) : ''
const isDirectRun =
  entryScript.endsWith('seed-uploads.ts') || entryScript.endsWith('seed-uploads.js')

if (isDirectRun) {
  main().catch((error) => {
    console.error('❌ uploads 种子生成失败:', error)
    process.exit(1)
  })
}

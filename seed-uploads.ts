import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  FRONTEND_ASSETS_DIR,
  SEED_ASSETS_DIR,
  UPLOAD_AUDIO_FILES,
  UPLOAD_IMAGE_COPIES,
} from './seed-upload-manifest'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.join(ROOT, 'uploads')

function resolveAssetsDir(): string | null {
  const candidates = [
    path.resolve(ROOT, FRONTEND_ASSETS_DIR),
    path.resolve(ROOT, SEED_ASSETS_DIR),
  ]
  return candidates.find((dir) => fs.existsSync(dir)) ?? null
}

function uploadsAlreadySeeded(): boolean {
  return fs.existsSync(path.join(UPLOADS_DIR, 'banners', 'banner1.jpg'))
}

/** 极短静音 MP3，避免种子数据音频 404 */
const SILENT_MP3 = Buffer.from(
  '/+MYxAAAAANIAAAAAExBTUUzLjk4LjIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'base64',
)

function ensureDir(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function copyAsset(assetsDir: string, relativeSrc: string, relativeDest: string) {
  const from = path.join(assetsDir, relativeSrc)
  const to = path.join(UPLOADS_DIR, relativeDest)

  if (!fs.existsSync(from)) {
    throw new Error(`缺少前端素材: ${from}`)
  }

  ensureDir(to)
  fs.copyFileSync(from, to)
}

export function seedUploadFiles() {
  if (uploadsAlreadySeeded()) {
    return 0
  }

  const assetsDir = resolveAssetsDir()
  if (!assetsDir) {
    throw new Error(
      '未找到 uploads 素材目录，请确认 fancheer-frontend 与 backend 为同级目录，或提供 backend/seed-assets',
    )
  }

  let copied = 0

  for (const item of UPLOAD_IMAGE_COPIES) {
    copyAsset(assetsDir, item.src, item.dest)
    copied += 1

    if (item.legacyDest) {
      copyAsset(assetsDir, item.src, item.legacyDest)
      copied += 1
    }
  }

  for (const relativeDest of UPLOAD_AUDIO_FILES) {
    const to = path.join(UPLOADS_DIR, relativeDest)
    ensureDir(to)
    fs.writeFileSync(to, SILENT_MP3)
    copied += 1
  }

  return copied
}

async function main() {
  console.log('📁 开始生成 uploads 种子文件...')
  const assetsDir = resolveAssetsDir()
  console.log(`   素材来源: ${assetsDir ?? '(已存在 uploads，跳过)'}`)
  console.log(`   输出目录: ${UPLOADS_DIR}`)

  const count = seedUploadFiles()

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

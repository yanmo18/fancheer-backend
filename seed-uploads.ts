import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  FRONTEND_ASSETS_DIR,
  UPLOAD_AUDIO_FILES,
  UPLOAD_IMAGE_COPIES,
} from './seed-upload-manifest'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const ASSETS_DIR = path.resolve(ROOT, FRONTEND_ASSETS_DIR)
const UPLOADS_DIR = path.join(ROOT, 'uploads')

/** 极短静音 MP3，避免种子数据音频 404 */
const SILENT_MP3 = Buffer.from(
  '/+MYxAAAAANIAAAAAExBTUUzLjk4LjIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'base64',
)

function ensureDir(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function copyAsset(relativeSrc: string, relativeDest: string) {
  const from = path.join(ASSETS_DIR, relativeSrc)
  const to = path.join(UPLOADS_DIR, relativeDest)

  if (!fs.existsSync(from)) {
    throw new Error(`缺少前端素材: ${from}`)
  }

  ensureDir(to)
  fs.copyFileSync(from, to)
}

export function seedUploadFiles() {
  if (!fs.existsSync(ASSETS_DIR)) {
    throw new Error(
      `未找到前端素材目录 ${ASSETS_DIR}，请确认 fancheer-frontend 与 backend 为同级目录`,
    )
  }

  let copied = 0

  for (const item of UPLOAD_IMAGE_COPIES) {
    copyAsset(item.src, item.dest)
    copied += 1

    if (item.legacyDest) {
      copyAsset(item.src, item.legacyDest)
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
  console.log(`   素材来源: ${ASSETS_DIR}`)
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

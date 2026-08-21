import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { FRONTEND_ASSETS_DIR, SEED_ASSETS_DIR } from './seed-upload-manifest'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const TARGET = path.join(ROOT, SEED_ASSETS_DIR)

function copyDir(from: string, to: string) {
  fs.mkdirSync(to, { recursive: true })
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name)
    const dest = path.join(to, entry.name)
    if (entry.isDirectory()) {
      copyDir(src, dest)
    } else {
      fs.copyFileSync(src, dest)
    }
  }
}

function main() {
  const source = path.resolve(ROOT, FRONTEND_ASSETS_DIR)
  if (!fs.existsSync(source)) {
    console.error(`❌ 未找到前端素材目录: ${source}`)
    console.error('   请确认 fancheer-frontend 与 backend 为同级目录')
    process.exit(1)
  }

  if (fs.existsSync(TARGET)) {
    fs.rmSync(TARGET, { recursive: true, force: true })
  }

  copyDir(source, TARGET)
  const count = fs.readdirSync(TARGET).length
  console.log(`✅ 已同步 ${count} 个文件到 ${SEED_ASSETS_DIR}/（供 Docker seed 使用）`)
}

main()

import fs from 'fs'
import os from 'os'
import path from 'path'
import sharp from 'sharp'
import { UPLOAD } from '../config/constants'

/** 与后台上传一致：最长边 1920、JPEG 质量 80，并按 EXIF 旋转 */
export async function writeCompressedJpeg(input: Buffer | string, destPath: string) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true })
  const source = typeof input === 'string' ? fs.readFileSync(input) : input
  const tmpPath = path.join(os.tmpdir(), `fancheer-img-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.jpg`)
  try {
    await sharp(source)
      .rotate()
      .resize({
        width: UPLOAD.MAX_IMAGE_EDGE,
        height: UPLOAD.MAX_IMAGE_EDGE,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: UPLOAD.JPEG_QUALITY })
      .toFile(tmpPath)

    const output = fs.readFileSync(tmpPath)
    fs.writeFileSync(destPath, output)
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)
  }
}



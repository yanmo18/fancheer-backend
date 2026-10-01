/**
 * 上传服务
 */

import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { Request } from 'express'
import AppError from '../utils/appError'
import { UPLOAD } from '../config/constants'
import { UPLOADS_DIR, uploadsSubdir } from '../config/paths'
import { writeCompressedJpeg } from '../utils/compressImage'

type MulterFile = NonNullable<Request['file']>

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a']

export const validateUploadCategory = (category: string): string => {
  if (!UPLOAD.ALLOWED_CATEGORIES.includes(category as typeof UPLOAD.ALLOWED_CATEGORIES[number])) {
    throw new AppError('无效的上传分类', 400)
  }
  return category
}

export const uploadImage = async (file: MulterFile, category?: string) => {
  const ext = path.extname(file.originalname).toLowerCase()

  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    throw new AppError('不支持的图片格式，仅支持 jpg/png/webp/gif', 400)
  }

  if (file.size > UPLOAD.MAX_IMAGE_SIZE) {
    throw new AppError('图片文件大小不能超过10MB', 400)
  }

  const safeCategory = validateUploadCategory(category || 'images')
  const newFilename = `${uuidv4()}.jpg`
  const uploadDir = uploadsSubdir(safeCategory)

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  const filePath = path.join(uploadDir, newFilename)

  try {
    await writeCompressedJpeg(file.buffer, filePath)
  } catch {
    throw new AppError('图片处理失败', 500)
  }

  const url = `/uploads/${safeCategory}/${newFilename}`
  return { url }
}

/** 删除本地上传文件（仅处理 /uploads/ 相对路径，忽略外链） */
export function deleteLocalUpload(url?: string | null) {
  if (!url?.startsWith('/uploads/')) return
  const relative = url.slice('/uploads/'.length)
  if (!relative || relative.includes('..')) return

  const filePath = path.join(UPLOADS_DIR, relative)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

export function deleteLocalUploads(...urls: Array<string | undefined | null>) {
  for (const url of urls) {
    deleteLocalUpload(url)
  }
}

/** 更新资源 URL 时清理被替换的本地文件 */
export function replaceLocalUpload(oldUrl?: string | null, newUrl?: string | null) {
  if (!oldUrl || oldUrl === newUrl) return
  deleteLocalUpload(oldUrl)
}

export const uploadAudio = async (file: MulterFile) => {
  const ext = path.extname(file.originalname).toLowerCase()

  if (!ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
    throw new AppError('不支持的音频格式，仅支持 mp3/wav/ogg/m4a', 400)
  }

  if (file.size > UPLOAD.MAX_AUDIO_SIZE) {
    throw new AppError('音频文件大小不能超过50MB', 400)
  }

  const uploadDir = uploadsSubdir('audio')
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  const { probeAudioNeedsTranscode, resolveFfmpegPath, transcodeToMp3192 } = await import(
    '../utils/transcodeAudio'
  )
  const probe = await probeAudioNeedsTranscode(file.buffer)
  const canTranscode = Boolean(resolveFfmpegPath()) && probe.needsTranscode

  if (canTranscode) {
    const tempName = `${uuidv4()}${ext}`
    const tempPath = path.join(uploadDir, `tmp-${tempName}`)
    const outName = `${uuidv4()}.mp3`
    const outPath = path.join(uploadDir, outName)

    try {
      fs.writeFileSync(tempPath, file.buffer)
      await transcodeToMp3192(tempPath, outPath)
      return {
        url: `/uploads/audio/${outName}`,
        transcoded: true,
        sourceBitrateKbps: probe.bitrateKbps,
      }
    } catch {
      // 转码失败则回退原文件，避免上传中断
      try {
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath)
      } catch {
        /* ignore */
      }
      const fallbackName = `${uuidv4()}${ext}`
      const fallbackPath = path.join(uploadDir, fallbackName)
      fs.writeFileSync(fallbackPath, file.buffer)
      return {
        url: `/uploads/audio/${fallbackName}`,
        transcoded: false,
        sourceBitrateKbps: probe.bitrateKbps,
      }
    } finally {
      try {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
      } catch {
        /* ignore */
      }
    }
  }

  const newFilename = `${uuidv4()}${ext}`
  const filePath = path.join(uploadDir, newFilename)

  try {
    fs.writeFileSync(filePath, file.buffer)
  } catch {
    throw new AppError('音频保存失败', 500)
  }

  return {
    url: `/uploads/audio/${newFilename}`,
    transcoded: false,
    sourceBitrateKbps: probe.bitrateKbps,
  }
}

export default {
  uploadImage,
  uploadAudio,
  deleteLocalUpload,
  deleteLocalUploads,
  replaceLocalUpload,
}

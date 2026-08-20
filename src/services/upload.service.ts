/**
 * 上传服务
 */

import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { Request } from 'express'
import AppError from '../utils/appError'
import { UPLOAD } from '../config/constants'

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
  const uploadDir = path.join(__dirname, '../../uploads', safeCategory)

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  const filePath = path.join(uploadDir, newFilename)

  try {
    await sharp(file.buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(filePath)
  } catch {
    throw new AppError('图片处理失败', 500)
  }

  const url = `/uploads/${safeCategory}/${newFilename}`
  return { url }
}

export const uploadAudio = async (file: MulterFile) => {
  const ext = path.extname(file.originalname).toLowerCase()

  if (!ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
    throw new AppError('不支持的音频格式，仅支持 mp3/wav/ogg/m4a', 400)
  }

  if (file.size > UPLOAD.MAX_AUDIO_SIZE) {
    throw new AppError('音频文件大小不能超过50MB', 400)
  }

  const newFilename = `${uuidv4()}${ext}`
  const uploadDir = path.join(__dirname, '../../uploads/audio')

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  const filePath = path.join(uploadDir, newFilename)

  try {
    fs.writeFileSync(filePath, file.buffer)
  } catch {
    throw new AppError('音频保存失败', 500)
  }

  const url = `/uploads/audio/${newFilename}`
  return { url }
}

export default {
  uploadImage,
  uploadAudio
}

/**
 * 上传路由
 * 
 * 作用：定义文件上传相关接口路由
 * 
 * 接口列表：
 *   POST /api/upload/image - 上传图片（需要登录，仅admin/streamer）
 *   POST /api/upload/audio - 上传音频（需要登录，仅admin/streamer）
 */

import { Router } from 'express'
import multer from 'multer'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'
import { uploadImage, uploadAudio } from '../controllers/upload.controller'

const router = Router()

const storage = multer.memoryStorage()
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
})

router.post('/upload/image', authMiddleware, requireRole(['admin', 'streamer']), upload.single('file'), uploadImage)
router.post('/upload/audio', authMiddleware, requireRole(['admin', 'streamer']), upload.single('file'), uploadAudio)

export default router
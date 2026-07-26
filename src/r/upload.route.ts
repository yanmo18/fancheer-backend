/**
 * 上传路由
 * 
 * 作用：定义文件上传相关接口路由
 * 
 * 接口列表：
 *   POST /api/upload/image - 上传图片（需要登录）
 */

import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { uploadImage } from '../controllers/upload.controller'

const router = Router()

router.post('/upload/image', authMiddleware, uploadImage)

export default router
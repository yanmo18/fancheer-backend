/**
 * 图集路由
 * 
 * 作用：定义图集相关接口路由（二次元/三次元）
 * 
 * 接口列表：
 *   GET  /api/gallery            - 获取图集列表（无需登录）
 *   GET  /api/admin/gallery      - 后台获取图集（分页）（需要登录，admin/streamer）
 *   POST /api/admin/gallery      - 新增图片（需要登录，admin/streamer）
 *   PUT  /api/admin/gallery/:id  - 编辑图片（需要登录，admin/streamer）
 *   DELETE /api/admin/gallery/:id - 删除图片（需要登录，admin/streamer）
 */

import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'
import { getGallery, getAdminGallery, createGalleryImage, updateGalleryImage, deleteGalleryImage } from '../controllers/gallery.controller'

const router = Router()

router.get('/gallery', getGallery)
router.get('/admin/gallery', authMiddleware, requireRole(['admin', 'streamer']), getAdminGallery)
router.post('/admin/gallery', authMiddleware, requireRole(['admin', 'streamer']), createGalleryImage)
router.put('/admin/gallery/:id', authMiddleware, requireRole(['admin', 'streamer']), updateGalleryImage)
router.delete('/admin/gallery/:id', authMiddleware, requireRole(['admin', 'streamer']), deleteGalleryImage)

export default router
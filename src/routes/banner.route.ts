/**
 * Banner模块路由
 * 
 * 作用：定义Banner相关接口路由（前台获取/后台CRUD）
 * 
 * 接口列表：
 *   GET  /api/banners              - 前台获取Banner列表（无需登录）
 *   GET  /api/admin/banners        - 后台获取全部Banner（分页）（需要登录，admin/streamer）
 *   POST /api/admin/banners        - 新增Banner（需要登录，admin/streamer）
 *   PUT  /api/admin/banners/:id    - 编辑Banner（需要登录，admin/streamer）
 *   DELETE /api/admin/banners/:id  - 删除Banner（需要登录，admin/streamer）
 */

import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'
import { getBanners, getAdminBanners, createBanner, updateBanner, deleteBanner } from '../controllers/banner.controller'

const router = Router()

router.get('/', getBanners)
router.get('/admin/banners', authMiddleware, requireRole(['admin', 'streamer']), getAdminBanners)
router.post('/admin/banners', authMiddleware, requireRole(['admin', 'streamer']), createBanner)
router.put('/admin/banners/:id', authMiddleware, requireRole(['admin', 'streamer']), updateBanner)
router.delete('/admin/banners/:id', authMiddleware, requireRole(['admin', 'streamer']), deleteBanner)

export default router
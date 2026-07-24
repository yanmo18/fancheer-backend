/**
 * 获奖记录路由
 * 
 * 作用：定义获奖记录相关接口路由（前台获取/后台CRUD）
 * 
 * 接口列表：
 *   GET  /api/awards              - 前台获取获奖记录列表（无需登录）
 *   GET  /api/admin/awards        - 后台获取获奖记录（分页）（需要登录，admin/streamer）
 *   POST /api/admin/awards        - 新增获奖记录（需要登录，admin/streamer）
 *   PUT  /api/admin/awards/:id    - 编辑获奖记录（需要登录，admin/streamer）
 *   DELETE /api/admin/awards/:id  - 删除获奖记录（需要登录，admin/streamer）
 */

import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'
import { getAwards, getAdminAwards, createAward, updateAward, deleteAward } from '../controllers/awards.controller'

const router = Router()

router.get('/awards', getAwards)
router.get('/admin/awards', authMiddleware, requireRole(['admin', 'streamer']), getAdminAwards)
router.post('/admin/awards', authMiddleware, requireRole(['admin', 'streamer']), createAward)
router.put('/admin/awards/:id', authMiddleware, requireRole(['admin', 'streamer']), updateAward)
router.delete('/admin/awards/:id', authMiddleware, requireRole(['admin', 'streamer']), deleteAward)

export default router
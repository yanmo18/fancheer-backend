/**
 * 主播资料路由
 * 
 * 作用：定义主播资料相关接口路由（前台获取/后台编辑）
 * 
 * 接口列表：
 *   GET  /api/streamer-info       - 前台获取主播资料（无需登录）
 *   GET  /api/admin/streamer-info - 后台获取主播资料（需要登录，admin/streamer）
 *   PUT  /api/admin/streamer-info - 编辑主播资料（需要登录，admin/streamer）
 */

import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'
import { getStreamerInfo, getAdminStreamerInfo, updateStreamerInfo } from '../controllers/streamer.controller'

const router = Router()

router.get('/streamer-info', getStreamerInfo)
router.get('/admin/streamer-info', authMiddleware, requireRole(['admin', 'streamer']), getAdminStreamerInfo)
router.put('/admin/streamer-info', authMiddleware, requireRole(['admin', 'streamer']), updateStreamerInfo)

export default router
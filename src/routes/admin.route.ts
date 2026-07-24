/**
 * 管理后台路由
 * 
 * 作用：定义管理后台相关接口路由（用户管理/操作日志）
 * 
 * 接口列表：
 *   GET  /api/admin/users        - 获取用户列表（需要登录，admin/streamer）
 *   PUT  /api/admin/users/:id/status - 更新用户状态（封禁/解封）（需要登录，admin/streamer）
 *   GET  /api/admin/logs         - 获取操作日志（需要登录，admin/streamer）
 */

import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'
import { getUsers, updateUserStatus, getLogs } from '../controllers/admin.controller'

const router = Router()

router.get('/admin/users', authMiddleware, requireRole(['admin', 'streamer']), getUsers)
router.put('/admin/users/:id/status', authMiddleware, requireRole(['admin', 'streamer']), updateUserStatus)
router.get('/admin/logs', authMiddleware, requireRole(['admin', 'streamer']), getLogs)

export default router
/**
 * 活动日历路由
 * 
 * 作用：定义活动日历相关接口路由（前台获取/后台CRUD）
 * 
 * 接口列表：
 *   GET  /api/activities         - 获取活动列表（无需登录）
 *   GET  /api/admin/activities   - 后台获取活动（分页）（需要登录，admin/streamer）
 *   POST /api/admin/activities   - 新增活动（需要登录，admin/streamer）
 *   PUT  /api/admin/activities/:id - 编辑活动（需要登录，admin/streamer）
 *   DELETE /api/admin/activities/:id - 删除活动（需要登录，admin/streamer）
 */

import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'
import { getActivities, getAdminActivities, createActivity, updateActivity, deleteActivity } from '../controllers/activities.controller'

const router = Router()

router.get('/activities', getActivities)
router.get('/admin/activities', authMiddleware, requireRole(['admin', 'streamer']), getAdminActivities)
router.post('/admin/activities', authMiddleware, requireRole(['admin', 'streamer']), createActivity)
router.put('/admin/activities/:id', authMiddleware, requireRole(['admin', 'streamer']), updateActivity)
router.delete('/admin/activities/:id', authMiddleware, requireRole(['admin', 'streamer']), deleteActivity)

export default router
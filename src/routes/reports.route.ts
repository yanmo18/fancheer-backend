/**
 * 举报工单路由
 * 
 * 作用：定义举报工单相关接口路由（提交举报/处理举报）
 * 
 * 接口列表：
 *   POST /api/reports            - 提交举报（需要登录）
 *   GET  /api/admin/reports      - 获取举报列表（需要登录，admin/streamer）
 *   PUT  /api/admin/reports/:id  - 处理举报（需要登录，admin/streamer）
 */

import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'
import { createReport, getReports, handleReport } from '../controllers/reports.controller'

const router = Router()

router.post('/reports', authMiddleware, createReport)
router.get('/admin/reports', authMiddleware, requireRole(['admin', 'streamer']), getReports)
router.put('/admin/reports/:id', authMiddleware, requireRole(['admin', 'streamer']), handleReport)

export default router
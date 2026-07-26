/**
 * 举报工单路由
 * 
 * 作用：定义举报工单相关接口路由（后台管理）
 * 
 * 接口列表：
 *   GET  /api/admin/reports/pending   - 获取待处理工单（需要登录，admin/streamer）
 *   GET  /api/admin/reports/resolved  - 获取已办结工单（需要登录，admin/streamer）
 *   GET  /api/admin/reports/:id       - 查看工单详情（需要登录，admin/streamer）
 *   PUT  /api/admin/reports/:id/resolve - 标记工单为办结（需要登录，admin/streamer）
 *   DELETE /api/admin/reports/:id/message - 删除被举报的违规消息（需要登录，admin/streamer）
 */

import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'
import { 
  getPendingReports, 
  getResolvedReports, 
  getReportDetail, 
  resolveReport,
  deleteViolationMessage
} from '../controllers/reports.controller'

const router = Router()

router.get('/admin/reports/pending', authMiddleware, requireRole(['admin', 'streamer']), getPendingReports)
router.get('/admin/reports/resolved', authMiddleware, requireRole(['admin', 'streamer']), getResolvedReports)
router.get('/admin/reports/:id', authMiddleware, requireRole(['admin', 'streamer']), getReportDetail)
router.put('/admin/reports/:id/resolve', authMiddleware, requireRole(['admin', 'streamer']), resolveReport)
router.delete('/admin/reports/:id/message', authMiddleware, requireRole(['admin', 'streamer']), deleteViolationMessage)

export default router
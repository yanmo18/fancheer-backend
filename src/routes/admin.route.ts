/**
 * 管理后台路由
 * 
 * 作用：定义管理后台相关接口路由（用户管理/消息管理/头像池管理/敏感词管理/操作日志）
 * 
 * 接口列表：
 *   GET  /api/admin/users          - 获取用户列表（需要登录，admin/streamer）
 *   PUT  /api/admin/users/:id/ban  - 封禁用户（需要登录，admin/streamer）
 *   PUT  /api/admin/users/:id/unban - 解封用户（需要登录，admin/streamer）
 *   PUT  /api/admin/users/:id/role - 设置/取消管理员（需要登录，仅streamer）
 *   GET  /api/admin/messages/public - 获取全部公开消息（需要登录，admin/streamer）
 *   GET  /api/admin/messages/private - 获取全部私密消息（需要登录，仅streamer）
 *   DELETE /api/admin/messages/:id - 删除消息（需要登录，admin/streamer）
 *   GET  /api/admin/avatars        - 获取头像池列表（需要登录，admin/streamer）
 *   POST /api/admin/avatars        - 新增头像（需要登录，admin/streamer）
 *   DELETE /api/admin/avatars/:id  - 删除头像（需要登录，admin/streamer）
 *   GET  /api/admin/sensitive-words - 获取敏感词列表（需要登录，admin/streamer）
 *   POST /api/admin/sensitive-words - 新增敏感词（需要登录，admin/streamer）
 *   DELETE /api/admin/sensitive-words/:id - 删除敏感词（需要登录，admin/streamer）
 *   GET  /api/admin/logs           - 获取操作日志（需要登录，admin/streamer）
 */

import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'
import { 
  getUsers, 
  banUser, 
  unbanUser, 
  updateUserRole,
  getLogs,
  getPublicMessages,
  getPrivateMessages,
  deleteMessage,
  getAvatars,
  createAvatar,
  deleteAvatar,
  getSensitiveWords,
  createSensitiveWord,
  deleteSensitiveWord
} from '../controllers/admin.controller'

const router = Router()

router.get('/admin/users', authMiddleware, requireRole(['admin', 'streamer']), getUsers)
router.put('/admin/users/:id/ban', authMiddleware, requireRole(['admin', 'streamer']), banUser)
router.put('/admin/users/:id/unban', authMiddleware, requireRole(['admin', 'streamer']), unbanUser)
router.put('/admin/users/:id/role', authMiddleware, requireRole(['streamer']), updateUserRole)

router.get('/admin/messages/public', authMiddleware, requireRole(['admin', 'streamer']), getPublicMessages)
router.get('/admin/messages/private', authMiddleware, requireRole(['streamer']), getPrivateMessages)
router.delete('/admin/messages/:id', authMiddleware, requireRole(['admin', 'streamer']), deleteMessage)

router.get('/admin/avatars', authMiddleware, requireRole(['admin', 'streamer']), getAvatars)
router.post('/admin/avatars', authMiddleware, requireRole(['admin', 'streamer']), createAvatar)
router.delete('/admin/avatars/:id', authMiddleware, requireRole(['admin', 'streamer']), deleteAvatar)

router.get('/admin/sensitive-words', authMiddleware, requireRole(['admin', 'streamer']), getSensitiveWords)
router.post('/admin/sensitive-words', authMiddleware, requireRole(['admin', 'streamer']), createSensitiveWord)
router.delete('/admin/sensitive-words/:id', authMiddleware, requireRole(['admin', 'streamer']), deleteSensitiveWord)

router.get('/admin/logs', authMiddleware, requireRole(['admin', 'streamer']), getLogs)

export default router
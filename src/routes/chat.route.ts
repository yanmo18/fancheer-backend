/**
 * 聊天室路由
 * 
 * 作用：定义聊天室相关接口路由（发送消息/获取消息/点赞/私密消息）
 * 
 * 接口列表：
 *   GET  /api/chat/messages      - 获取公开消息列表（需要登录）
 *   POST /api/chat/message       - 发送公开消息（需要登录）
 *   POST /api/chat/private       - 发送私密消息（需要登录）
 *   POST /api/chat/messages/:id/like - 点赞消息（需要登录）
 *   GET  /api/chat/private       - 获取我的私密消息（需要登录）
 */

import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'
import { getMessages, sendMessage, sendPrivateMessage, likeMessage, getPrivateMessages } from '../controllers/chat.controller'

const router = Router()

router.get('/messages', authMiddleware, getMessages)
router.post('/message', authMiddleware, sendMessage)
router.post('/private', authMiddleware, sendPrivateMessage)
router.post('/messages/:id/like', authMiddleware, likeMessage)
router.get('/private', authMiddleware, getPrivateMessages)

export default router
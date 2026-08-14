/**
 * 聊天室路由
 * 
 * 作用：定义聊天室相关接口路由（发送消息/获取消息/点赞/私密消息）
 * 
 * 接口列表：
 *   GET  /api/messages/public       - 获取公开消息列表（轮询用）
 *   GET  /api/messages/public-replies - 获取主播公开回复列表（全员可见，匿名展示）
 *   GET  /api/messages/private/sent - 获取我发出的私密留言（仅粉丝）
 *   GET  /api/messages/private      - 获取博主对我的私密回复（仅粉丝）
 *   POST /api/messages              - 发送消息（公开/私密）
 *   POST /api/messages/:id/like     - 点赞消息
 *   DELETE /api/messages/:id/like   - 取消点赞
 *   POST /api/messages/:id/report   - 举报消息
 *   POST /api/messages/:id/streamer-reply - 主播发送公开回复
 *   POST /api/messages/:id/private-reply - 主播发送私密回复
 *   GET  /api/messages/:id/private-replies - 获取某消息的回复列表
 */

import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'
import { 
  getPublicMessages, 
  getPublicReplies,
  getPrivateMessages, 
  getSentPrivateMessages,
  sendMessage, 
  likeMessage, 
  unlikeMessage,
  reportMessage,
  streamerReply,
  privateReply,
  getPrivateReplies
} from '../controllers/chat.controller'

const router = Router()

router.get('/public', authMiddleware, getPublicMessages)
router.get('/public-replies', authMiddleware, getPublicReplies)
router.get('/private/sent', authMiddleware, getSentPrivateMessages)
router.get('/private', authMiddleware, getPrivateMessages)
router.post('/', authMiddleware, sendMessage)
router.post('/:id/like', authMiddleware, likeMessage)
router.delete('/:id/like', authMiddleware, unlikeMessage)
router.post('/:id/report', authMiddleware, reportMessage)
router.post('/:id/streamer-reply', authMiddleware, requireRole(['streamer']), streamerReply)
router.post('/:id/private-reply', authMiddleware, requireRole(['streamer']), privateReply)
router.get('/:id/private-replies', authMiddleware, getPrivateReplies)

export default router
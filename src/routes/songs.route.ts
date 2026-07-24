/**
 * 音乐路由
 * 
 * 作用：定义音乐相关接口路由（歌曲列表）
 * 
 * 接口列表：
 *   GET  /api/songs              - 获取歌曲列表（无需登录）
 *   GET  /api/admin/songs        - 后台获取歌曲（分页）（需要登录，admin/streamer）
 *   POST /api/admin/songs        - 新增歌曲（需要登录，admin/streamer）
 *   PUT  /api/admin/songs/:id    - 编辑歌曲（需要登录，admin/streamer）
 *   DELETE /api/admin/songs/:id  - 删除歌曲（需要登录，admin/streamer）
 */

import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'
import { getSongs, getAdminSongs, createSong, updateSong, deleteSong } from '../controllers/songs.controller'

const router = Router()

router.get('/songs', getSongs)
router.get('/admin/songs', authMiddleware, requireRole(['admin', 'streamer']), getAdminSongs)
router.post('/admin/songs', authMiddleware, requireRole(['admin', 'streamer']), createSong)
router.put('/admin/songs/:id', authMiddleware, requireRole(['admin', 'streamer']), updateSong)
router.delete('/admin/songs/:id', authMiddleware, requireRole(['admin', 'streamer']), deleteSong)

export default router
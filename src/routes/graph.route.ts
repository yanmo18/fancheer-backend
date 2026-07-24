/**
 * 关系图谱路由
 * 
 * 作用：定义关系图谱相关接口路由（人物/连线）
 * 
 * 接口列表：
 *   GET  /api/graph/characters   - 获取图谱人物列表（无需登录）
 *   GET  /api/graph/relations    - 获取图谱关系连线（无需登录）
 *   GET  /api/admin/graph/characters - 后台获取人物（需要登录，admin/streamer）
 *   POST /api/admin/graph/characters - 新增人物（需要登录，admin/streamer）
 *   PUT  /api/admin/graph/characters/:id - 编辑人物（需要登录，admin/streamer）
 *   DELETE /api/admin/graph/characters/:id - 删除人物（需要登录，admin/streamer）
 *   GET  /api/admin/graph/relations - 后台获取关系（需要登录，admin/streamer）
 *   POST /api/admin/graph/relations - 新增关系（需要登录，admin/streamer）
 *   PUT  /api/admin/graph/relations/:id - 编辑关系（需要登录，admin/streamer）
 *   DELETE /api/admin/graph/relations/:id - 删除关系（需要登录，admin/streamer）
 */

import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'
import { getCharacters, getRelations, getAdminCharacters, createCharacter, updateCharacter, deleteCharacter, getAdminRelations, createRelation, updateRelation, deleteRelation } from '../controllers/graph.controller'

const router = Router()

router.get('/graph/characters', getCharacters)
router.get('/graph/relations', getRelations)

router.get('/admin/graph/characters', authMiddleware, requireRole(['admin', 'streamer']), getAdminCharacters)
router.post('/admin/graph/characters', authMiddleware, requireRole(['admin', 'streamer']), createCharacter)
router.put('/admin/graph/characters/:id', authMiddleware, requireRole(['admin', 'streamer']), updateCharacter)
router.delete('/admin/graph/characters/:id', authMiddleware, requireRole(['admin', 'streamer']), deleteCharacter)

router.get('/admin/graph/relations', authMiddleware, requireRole(['admin', 'streamer']), getAdminRelations)
router.post('/admin/graph/relations', authMiddleware, requireRole(['admin', 'streamer']), createRelation)
router.put('/admin/graph/relations/:id', authMiddleware, requireRole(['admin', 'streamer']), updateRelation)
router.delete('/admin/graph/relations/:id', authMiddleware, requireRole(['admin', 'streamer']), deleteRelation)

export default router
/**
 * 用户模块路由
 * 
 * 作用：定义用户相关接口路由（修改昵称/修改头像/获取头像池）
 * 
 * 接口列表：
 *   PUT  /api/user/nickname        - 修改展示昵称（需要登录）
 *   PUT  /api/user/avatar          - 选择系统头像（需要登录）
 *   GET  /api/user/avatars         - 获取系统头像池（需要登录）
 */

import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { updateNickname, updateAvatar, getAvatars } from '../controllers/user.controller'

const router = Router()

router.put('/nickname', authMiddleware, updateNickname)
router.put('/avatar', authMiddleware, updateAvatar)
router.get('/avatars', authMiddleware, getAvatars)

export default router
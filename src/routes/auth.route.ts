/**
 * 认证模块路由
 * 
 * 作用：定义认证相关接口路由（验证码/注册/登录/登出/获取用户信息）
 * 接口列表：
 *   GET  /api/auth/captcha    - 获取图形验证码
 *   POST /api/auth/register   - 用户注册
 *   POST /api/auth/login      - 用户登录
 *   POST /api/auth/logout     - 用户登出（需要登录）
 *   GET  /api/auth/me         - 获取当前用户信息（需要登录）
 */

import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { getCaptcha, register, login, logout, getMe } from '../controllers/auth.controller'

const router = Router()

router.get('/captcha', getCaptcha)
router.post('/register', register)
router.post('/login', login)
router.post('/logout', authMiddleware, logout)
router.get('/me', authMiddleware, getMe)

export default router
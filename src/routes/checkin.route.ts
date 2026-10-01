/**
 * 打卡路由
 * 
 * 作用：定义打卡相关接口路由（打卡/打卡日历）
 * 
 * 接口列表：
 *   POST /api/checkin            - 每日打卡（需要登录）
 *   GET  /api/checkin/calendar   - 获取打卡日历（需要登录）
 *   GET  /api/checkin/stats      - 累计/连续打卡（需要登录）
 */

import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { checkin, getCheckinCalendar, getCheckinStats } from '../controllers/checkin.controller'

const router = Router()

router.post('/', authMiddleware, checkin)
router.get('/calendar', authMiddleware, getCheckinCalendar)
router.get('/stats', authMiddleware, getCheckinStats)

export default router
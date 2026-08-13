/**
 * 健康检查路由
 */

import { Router } from 'express'
import { success, fail } from '../utils/response'
import { prisma } from '../lib/prisma'
import redis from '../config/redis'

const router = Router()

router.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    await redis.ping()
    return res.json(success({
      status: 'ok',
      database: 'connected',
      redis: 'connected',
      time: new Date()
    }))
  } catch {
    return res.json(fail('服务不健康', 500))
  }
})

export default router

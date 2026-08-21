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
    return res.status(200).json(success({
      status: 'ok',
      database: 'connected',
      redis: 'connected',
      time: new Date()
    }))
  } catch {
    return res.status(503).json(fail('服务不健康', 503))
  }
})

export default router

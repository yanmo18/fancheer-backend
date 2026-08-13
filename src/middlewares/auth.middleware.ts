/**
 * JWT鉴权中间件
 */

import { Response, NextFunction } from 'express'
import { verifyToken } from '../config/jwt'
import { fail } from '../utils/response'
import redis from '../config/redis'
import { prisma } from '../lib/prisma'
import { REDIS_KEYS } from '../config/constants'
import { UserRequest } from '../types'

export const authMiddleware = async (req: UserRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.json(fail('未登录', 401))
  }

  try {
    const payload = verifyToken(token)

    const isBlacklisted = await redis.exists(REDIS_KEYS.jwtBlacklist(payload.jti))
    if (isBlacklisted) {
      return res.json(fail('Token已失效', 401))
    }

    const user = await prisma.users.findUnique({
      where: { id: BigInt(payload.userId) },
      select: { status: true, role: true }
    })

    if (!user) {
      return res.json(fail('用户不存在', 401))
    }

    if (user.status === 'banned') {
      return res.json(fail('账号已被封禁，请联系管理员', 403))
    }

    req.user = { id: payload.userId, role: user.role }
    next()
  } catch {
    return res.json(fail('Token无效', 401))
  }
}

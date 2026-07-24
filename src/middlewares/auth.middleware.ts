/**
 * JWT鉴权中间件
 * 
 * 作用：拦截所有需要登录的接口，校验请求头Token是否合法、是否过期、是否被篡改
 *       解析用户ID、角色，挂载到 req.user 对象
 *       无Token/非法Token直接拦截，返回401未登录
 * 
 * 使用方式：
 *   import { authMiddleware } from '../middlewares/auth.middleware'
 *   router.get('/me', authMiddleware, getMe)
 */

import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../config/jwt'
import { fail } from '../utils/response'
import { redis } from '../config/redis'

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.json(fail('未登录', 401))
  }
  
  try {
    const payload = verifyToken(token) as any
    
    const isBlacklisted = await redis.exists(`jwt_blacklist:${payload.jti}`)
    if (isBlacklisted) {
      return res.json(fail('Token已失效', 401))
    }
    
    req.user = { id: payload.userId, role: payload.role }
    next()
  } catch (err) {
    return res.json(fail('Token无效', 401))
  }
}
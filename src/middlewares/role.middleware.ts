/**
 * 角色权限校验中间件
 * 
 * 作用：在登录鉴权之后执行，区分普通用户/管理员/主播角色
 *       后台管理接口仅ADMIN/STREAMER可放行，普通用户拦截403无权限
 * 
 * 使用方式：
 *   import { requireRole } from '../middlewares/role.middleware'
 *   router.get('/admin/users', authMiddleware, requireRole(['admin', 'streamer']), getUsers)
 */

import { Response, NextFunction } from 'express'
import { fail } from '../utils/response'
import { UserRequest } from '../types'

export const requireRole = (allowedRoles: string[]) => {
  return (req: UserRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.json(fail('权限不足', 403))
    }
    
    next()
  }
}
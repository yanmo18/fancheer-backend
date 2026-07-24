/**
 * 自定义类型定义
 * 
 * 作用：扩展 Express Request 类型，添加 user 属性
 *       定义项目中通用的类型接口
 * 
 * 使用方式：
 *   import { UserRequest } from '../types'
 *   const register = async (req: UserRequest, res: Response) => {
 *     const { id, role } = req.user // 类型安全
 *   }
 */

import { Request } from 'express'

export interface UserPayload {
  userId: number
  role: 'fan' | 'admin' | 'streamer'
  jti: string
}

export interface UserRequest extends Request {
  user?: {
    id: number
    role: 'fan' | 'admin' | 'streamer'
  }
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginationResult<T> {
  list: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
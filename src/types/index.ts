/**
 * 自定义类型定义
 */

import { Request } from 'express'

export interface UserPayload {
  userId: string
  role: 'fan' | 'admin' | 'streamer'
  jti: string
}

export interface UserRequest extends Request {
  user?: {
    id: string
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

/**
 * 全局异常处理中间件
 * 
 * 作用：捕获项目所有层级报错（代码错误、数据库报错、手动抛出业务错误）
 *       防止服务崩溃闪退，统一格式化错误响应
 * 
 * 挂载位置：必须最后挂载（在所有业务路由之后）
 * 
 * 使用方式：
 *   app.use(errorHandler)
 */

import { Request, Response, NextFunction } from 'express'
import AppError from '../utils/appError'

export default function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.code).json({
      code: err.code,
      msg: err.message,
      data: null
    })
  }

  console.error('❌ 服务异常：', err)
  res.status(500).json({
    code: 500,
    msg: '服务器内部错误',
    data: null
  })
}
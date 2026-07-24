/**
 * 请求日志中间件
 * 
 * 作用：全局记录所有接口请求日志（请求方式、路径、响应状态码、接口耗时）
 *       开发调试快速定位超时接口、报错接口、异常请求
 * 
 * 挂载位置：必须最先挂载（在所有中间件之前）
 * 
 * 使用方式：
 *   app.use(requestLogger)
 */

import { Request, Response, NextFunction } from 'express'

export default function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`📝 ${req.method} ${req.path} | 状态码：${res.statusCode} | 耗时：${duration}ms`)
  })
  
  next()
}
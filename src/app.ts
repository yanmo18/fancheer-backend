/**
 * 项目全局入口文件
 * 
 * 作用：全局加载环境变量、创建 Express 核心服务实例
 *       挂载全局基础中间件（日志、跨域、JSON解析）
 *       统一挂载所有业务路由、权限中间件、异常中间件
 *       实际监听端口见 `src/server.ts`
 * 
 * 中间件挂载顺序（固定不可乱）：
 *   1. 请求日志中间件（最先）
 *   2. 安全头（Helmet）
 *   3. 跨域处理
 *   4. 参数解析（json、urlencoded）
 *   5. 业务路由
 *   6. 全局异常中间件（最后）
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import requestLogger from './middlewares/requestLogger.middleware'
import errorHandler from './middlewares/error.middleware'
import { fail } from './utils/response'
import { UPLOADS_DIR } from './config/paths'
import { sniffImageContentType } from './utils/uploadMime'

dotenv.config()

;(BigInt.prototype as any).toJSON = function () { return this.toString() }

import './config/redis'

const app = express()

if (process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1)
}

app.use(requestLogger)

const isProd = process.env.NODE_ENV === 'production'
app.use(
  helmet({
    // /uploads 可能被另一域名的前端引用，不能用 same-origin
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
    hsts: isProd,
  }),
)

const corsOrigin = process.env.CORS_ORIGIN
app.use(cors(corsOrigin ? { origin: corsOrigin.split(',').map(s => s.trim()) } : undefined))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(
  '/uploads',
  express.static(UPLOADS_DIR, {
    maxAge: '1d',
    setHeaders(res, filePath) {
      const type = sniffImageContentType(filePath)
      if (type) res.setHeader('Content-Type', type)
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
    },
  }),
)
// 静态文件未命中时返回真正的 404，避免落到下方 JSON「接口不存在」(HTTP 200) 导致 <img> 破图
app.use('/uploads', (_req, res) => {
  res.status(404).type('text').send('Not Found')
})

app.get('/', (_req, res) => {
  res.json({
    code: 0,
    msg: 'success',
    data: { status: 'running', time: new Date() }
  })
})

import authRoutes from './routes/auth.route'
import userRoutes from './routes/user.route'
import bannerRoutes from './routes/banner.route'
import streamerRoutes from './routes/streamer.route'
import awardsRoutes from './routes/awards.route'
import chatRoutes from './routes/chat.route'
import checkinRoutes from './routes/checkin.route'
import galleryRoutes from './routes/gallery.route'
import songsRoutes from './routes/songs.route'
import activitiesRoutes from './routes/activities.route'
import graphRoutes from './routes/graph.route'
import reportsRoutes from './routes/reports.route'
import adminRoutes from './routes/admin.route'
import uploadRoutes from './routes/upload.route'
import healthRoutes from './routes/health.route'

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api', bannerRoutes)
app.use('/api', streamerRoutes)
app.use('/api', awardsRoutes)
app.use('/api/messages', chatRoutes)
app.use('/api/checkin', checkinRoutes)
app.use('/api', galleryRoutes)
app.use('/api', songsRoutes)
app.use('/api', activitiesRoutes)
app.use('/api', graphRoutes)
app.use('/api', reportsRoutes)
app.use('/api', adminRoutes)
app.use('/api', uploadRoutes)
app.use('/api', healthRoutes)

app.use((_req, res) => {
  res.status(200).json(fail('接口不存在', 404))
})

app.use(errorHandler)

export default app
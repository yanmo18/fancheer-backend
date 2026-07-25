/**
 * 项目全局入口文件
 * 
 * 作用：全局加载环境变量、创建 Express 核心服务实例
 *       挂载全局基础中间件（日志、跨域、JSON解析）
 *       统一挂载所有业务路由、权限中间件、异常中间件
 *       监听端口、启动Web服务
 * 
 * 中间件挂载顺序（固定不可乱）：
 *   1. 请求日志中间件（最先）
 *   2. 跨域处理
 *   3. 参数解析（json、urlencoded）
 *   4. 业务路由
 *   5. 全局异常中间件（最后）
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import requestLogger from './middlewares/requestLogger.middleware'
import errorHandler from './middlewares/error.middleware'

dotenv.config()

import './config/redis'

const app = express()
const PORT = Number(process.env.PORT) || 3000

app.use(requestLogger)
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.json({
    code: 0,
    msg: '后端服务启动成功',
    time: new Date()
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

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api', bannerRoutes)
app.use('/api', streamerRoutes)
app.use('/api', awardsRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/checkin', checkinRoutes)
app.use('/api', galleryRoutes)
app.use('/api', songsRoutes)
app.use('/api', activitiesRoutes)
app.use('/api', graphRoutes)
app.use('/api', reportsRoutes)
app.use('/api', adminRoutes)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 服务运行在 http://localhost:${PORT}`)
})

export default app
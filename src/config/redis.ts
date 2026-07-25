import { Redis } from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
})

redis.on('connect', () => {
  console.log('✅ Redis 缓存连接成功')
})

redis.on('error', (err) => {
  console.error('❌ Redis 连接失败:', err)
})

export default redis

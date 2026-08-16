// 创建Prisma客户端实例，数据库连接使用PrismaMariaDb适配器
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../../generated/prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const dbUrl = new URL(process.env.DATABASE_URL!)

// MySQL 8 默认 caching_sha2_password，本地非 SSL 连接常需此选项，否则会 pool timeout
const allowPublicKeyRetrieval = dbUrl.searchParams.has('allowPublicKeyRetrieval')
  ? dbUrl.searchParams.get('allowPublicKeyRetrieval') === 'true'
  : ['localhost', '127.0.0.1'].includes(dbUrl.hostname)

const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port) || 3306,
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.slice(1).replace(/^\//, ''),
  allowPublicKeyRetrieval,
})
// 全局唯一一个实例数据库。全项目只使用一个数据库连接
export const prisma = new PrismaClient({ adapter })

// 创建Prisma客户端实例唯一一个实例
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../../generated/prisma/client'
// 解析环境变量中的数据库URL
const dbUrl = new URL(process.env.DATABASE_URL!)
// 创建PrismaMariaDb实例，建立与数据库的连接
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port) || 3306,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1),
})
// 全局唯一一个实例数据库。全项目只使用一个数据库连接
export const prisma = new PrismaClient({ adapter })

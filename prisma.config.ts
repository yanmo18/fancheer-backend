// Prisma 配置文件，用于配置PrismaORM与数据库迁移连接行为
// 自动加载项目环境变量配置.env文件否则 env('DATABASE_URL') 无法读取到数据库链接字符串。
import 'dotenv/config'
// 导入 Prisma 配置函数，Prisma7官方推荐配置写法，自带ts类型检查。
import { defineConfig, env } from 'prisma/config'
// 导出配置对象，PrismaCLI会自动读取此文件，配置全局生效
export default defineConfig({
  // 指定数据 Prisma 数据库，枚举，模式定义文件路径。
  schema: 'prisma/schema.prisma',
  // 指定数据库迁移文件路径。
  // 数据库迁移文件路径必须是绝对路径，否则会报错。
  migrations: {
    path: 'prisma/migrations',
  },
  // 指定数据库链接地址。
  // 数据库链接地址必须是绝对路径，否则会报错。
  datasource: {
    url: env('DATABASE_URL'),
    // 安全的环境变量隔离。使用.env+PrismaCLI配置文件config.ts，避免将数据库链接字符串硬编码到代码中。
    // 这样可以确保数据库链接字符串不会被意外泄露。prisma client 会自动从环境变量中读取数据库链接字符串。
  },
})

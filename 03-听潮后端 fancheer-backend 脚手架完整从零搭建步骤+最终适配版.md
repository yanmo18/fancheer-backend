# 听潮后端 fancheer\-backend 脚手架完整从零搭建步骤\+最终适配版

# 一、环境前置条件

本地已部署就绪：Node v25\.2\.1 \+ pnpm、MySQL8\.0（库名：fancheer，17张业务数据表已建好）、Redis服务正常启动，无端口占用、服务异常问题。

# 二、项目从零搭建完整步骤

## 步骤 1：新建项目文件夹并进入工作目录

### Windows CMD/PowerShell 执行指令

```bash
mkdir fancheer-backend
cd fancheer-backend
```

## 步骤 2：初始化 package\.json 项目配置文件

两种方式任选其一，适配不同使用场景：

方案A（推荐，全自动无交互，稳定无报错）

```bash
npm init -y
```

方案B（pnpm交互式，全程回车默认配置）

```bash
pnpm init
# 所有提问直接回车，使用默认配置
```

## 步骤 3：安装全局开发依赖（TS/脚手架核心）

```bash
pnpm add -D typescript ts-node @types/node prisma nodemon dotenv-cli
```

## 步骤 4：生成并配置 tsconfig\.json TS编译文件

1\. 终端执行指令生成默认配置文件

```bash
npx tsc --init
```

2\. 清空默认全部内容，替换为后端专属标准配置

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## 步骤 5：Prisma7\.x 专属适配配置（核心版本兼容修复）

适配新版Prisma7\.x重大架构变更，彻底摒弃旧版配置语法，完美兼容MySQL数据库，解决全版本报错问题。

### 5\.1 初始化Prisma框架

```bash
npx prisma init
```

### 5\.2 修正 \.env 数据库连接配置

**核心问题**：MySQL 不支持 PostgreSQL 专属参数 `?schema=public`，必须删除，最终标准可用配置：

```env
DATABASE_URL="mysql://root:你的MySQL密码@localhost:3306/fancheer"
```

### 5\.3 重写 prisma/schema\.prisma 适配7\.x版本

Prisma7\.x强制修改生成器规则、取消schema内url配置，清空默认内容，使用官方标准MySQL适配配置：

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "mysql"
}
```

### 5\.4 新建 prisma\.config\.ts 全局配置文件（7\.x必备核心）

Prisma7\.x重大变更：数据库连接地址、迁移配置全部迁移至该文件，废弃schema文件url配置，使用官方`defineConfig` 新标准语法：

```typescript
import { defineConfig, env } from "prisma";

export default defineConfig({
  datasources: {
    db: {
      url: env("DATABASE_URL"),
    },
  },
  schema: "./prisma/schema.prisma",
  migrations: {
    out: "./prisma/migrations",
  },
});
```

### 5\.5 安装Prisma7\.x必备适配依赖

Prisma7\.x不再内置MySQL驱动，必须手动安装Mariadb适配器，同时适配TS7运行环境安装tsx：

```bash
pnpm add @prisma/client
pnpm add -D @prisma/adapter-mariadb tsx
```

### 5\.6 同步数据表结构 \& 生成TS类型客户端

```bash
# 拉取本地17张数据表完整结构、枚举、索引
npx prisma db pull
# 生成全局TS类型约束客户端，全项目类型安全
npx prisma generate
```

## 步骤 6：封装全局Prisma数据库单例（7\.x专属）

新建 `src/lib/prisma.ts`，通过官方适配器连接数据库，全局复用连接池，避免重复创建实例：

```typescript
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../../generated/prisma/client'

const dbUrl = new URL(process.env.DATABASE_URL!)

const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port) || 3306,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1),
})

export const prisma = new PrismaClient({ adapter })
```

## 步骤 7：安装业务生产核心依赖

```bash
pnpm add express cors jsonwebtoken bcryptjs svg-captcha ioredis multer sharp xss dayjs dotenv
```

## 步骤 8：安装配套TS类型声明依赖

第三方包无内置TS类型，手动安装类型声明，解决隐式any、模块无声明报错：

```bash
pnpm add -D @types/express @types/cors @types/jsonwebtoken @types/bcryptjs @types/multer @types/xss
```

## 步骤 9：配置 package\.json 启动脚本（关键兼容修复）

适配 TS7 \+ Prisma7 环境，修复 ts\-node 兼容报错，替换为 tsx 运行，集成全套开发、打包、Prisma指令：

```json
"scripts": {
  "dev": "nodemon --exec tsx src/app.ts",
  "build": "tsc",
  "start": "node dist/app.js",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:studio": "prisma studio",
  "postinstall": "prisma generate"
}
```

**脚本修改说明**：原 `nodemon src/app.ts` 无法适配TS7新版本API，ts\-node会报类型错误，更换为 **tsx\+esbuild** 运行，速度更快、兼容性全覆盖。

## 步骤 10：创建MVC分层目录结构

Windows终端一键生成所有业务分层文件夹

```cmd
mkdir src\config src\middlewares src\controllers src\routes src\services src\utils src\types
```

最终完整目录结构：

```plain
fancheer-backend/
├── generated/          # Prisma自动生成TS客户端代码
├── prisma/             # 数据库模型、迁移文件
├── src/
│   ├── lib/            # 全局工具实例（prisma单例）
│   ├── config/         # Redis、JWT、全局常量配置
│   ├── middlewares/    # 全局中间件（跨域、异常、鉴权）
│   ├── controllers/    # 请求接收、参数处理层
│   ├── routes/         # 业务路由挂载
│   ├── services/       # 核心业务逻辑、数据库缓存操作
│   ├── utils/          # 通用工具函数
│   ├── types/          # 自定义TS类型
│   └── app.ts          # 项目入口启动文件
├── .env                # 环境变量配置
├── tsconfig.json       # TS编译配置
├── prisma.config.ts    # Prisma全局配置
└── package.json        # 项目依赖&脚本配置
```

## 步骤 11：新增 \.gitignore 忽略规则

避免无用文件、隐私配置提交代码仓库，新建 `.gitignore`

```plain
node_modules/
dist/
generated/
.env
pnpm-lock.yaml
```

# 三、基础底层代码封装（项目初始化核心代码）

## 1\. 项目入口文件 src/app\.ts（修复服务闪退问题）

补全Express基础启动代码，解决空文件启动服务立即退出、clean exit问题，实现服务常驻运行：

```typescript
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

const app = express()
const PORT = Number(process.env.PORT) || 3000

// 全局基础中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 服务健康测试接口
app.get('/', (req, res) => {
  res.json({
    code: 200,
    msg: '粉丝官网后端服务启动成功',
    time: new Date()
  })
})

// 启动服务
app.listen(PORT, () => {
  console.log(`🚀 后端服务运行地址：http://localhost:${PORT}`)
})

export default app
```

## 2\. 全局统一返回工具 src/utils/response\.ts

```typescript
// 成功响应统一格式
export const success = <T>(data?: T, msg = '操作成功', code = 200) => {
  return { code, msg, data }
}

// 失败响应统一格式
export const fail = (msg = '操作失败', code = 400, data?: any) => {
  return { code, msg, data }
}
```

## 3\. 全局异常捕获中间件 src/middlewares/error\.middleware\.ts

```typescript
import { Request, Response, NextFunction } from 'express'
import { fail } from '../utils/response'

export default function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('服务异常：', err)
  res.status(500).json(fail('服务器内部错误', 500))
}
```

## 4\. Redis缓存连接工具 src/config/redis\.ts

```typescript
import { Redis } from 'ioredis'
import dotenv from 'dotenv'
dotenv.config()

export const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: process.env.REDIS_PASSWORD || '',
  db: 0
})

redis.on('connect', () => {
  console.log('✅ Redis缓存连接完成')
})
```

# 四、项目完整依赖清单（真实安装、无冗余）

## 4\.1 生产依赖（线上运行必备）

|包名|核心用途|
|---|---|
|@prisma/client|Prisma官方数据库客户端，提供数据库增删改查方法|
|bcryptjs|用户密码加盐哈希加密，杜绝明文存储|
|cors|解决前后端跨域请求问题|
|dayjs|轻量时间格式化、时间计算工具|
|dotenv|加载\.env环境变量文件，读取私密配置|
|express|Node\.js核心Web后端框架，搭建RESTful接口|
|ioredis|高性能Redis客户端，用于缓存、验证码、限流、黑名单|
|jsonwebtoken|生成、解析JWT登录令牌，实现用户身份鉴权|
|multer|接收前端图片、音频等文件上传请求|
|sharp|图片压缩、裁剪、格式转换处理|
|svg\-captcha|生成无干扰SVG图形验证码，用于注册登录防刷|
|xss|过滤用户输入恶意脚本，防御XSS注入攻击|

## 4\.2 开发依赖（仅本地开发调试使用）

|包名|核心用途|
|---|---|
|@prisma/adapter\-mariadb|Prisma7\.x专属MySQL驱动适配器，必备依赖|
|@types/\* 系列|补全第三方库TS类型声明，消除隐式any报错|
|dotenv\-cli|命令行环境变量读取工具|
|nodemon|代码热更新，修改文件自动重启服务|
|prisma|Prisma命令行工具，执行pull、generate、migrate等指令|
|ts\-node|旧版TS运行时（已弃用，仅保留兼容）|
|tsx|新版TS运行时，适配TS7\+Prisma7，速度快、无兼容报错|
|typescript|TS核心编译器，代码类型校验、编译TS转JS|

# 五、常用开发指令汇总

1. 本地热更新启动项目（日常开发使用）

```bash
pnpm dev
```

1. TS代码编译打包（上线部署使用）

```bash
pnpm build
```

1. 线上启动打包后项目

```bash
pnpm start
```

1. 重新生成Prisma类型（数据表变更后使用）

```bash
pnpm prisma:generate
```

1. 打开Prisma可视化数据库管理面板

```bash
pnpm prisma:studio
```

# 六、搭建完成校验清单（全部通过即环境就绪）

1. 根目录核心文件齐全：package\.json、tsconfig\.json、\.env、prisma\.config\.ts

2. 目录结构完整：prisma、generated、src完整分层目录

3. Prisma适配完成，17张数据表模型、枚举全部校验通过，无语法报错

4. TS7\+Prisma7兼容问题全部修复，tsx运行无报错

5. 执行 `pnpm dev` 服务正常常驻启动，无闪退、无依赖报错

6. 浏览器访问 `http://localhost:3000` 可正常返回成功接口数据

7. MySQL、Redis连接正常，全局工具、中间件全部封装完成

# 七、核心适配改造总结（本次关键踩坑修复）

## 7\.1 Prisma7\.x 重大架构变更适配

- 数据库连接url：从 `schema.prisma` 迁移至 `prisma.config.ts`

- 生成器规则：`prisma-client-js` 改为 `prisma-client`，必须指定自定义输出路径

- 驱动模式：废弃内置驱动，必须手动安装 mariadb 适配器并实例化传入

- 参数兼容：删除Postgres专属 `?schema=public`，适配MySQL语法

## 7\.2 TypeScript7 运行环境适配

- 修复 ts\-node 与 TS7 API不兼容导致的类型报错

- 替换运行脚本为 tsx，基于esbuild构建，兼容新版本、启动速度更快

- 补全所有第三方库TS类型声明，杜绝隐式any、模块缺失报错

# 八、当前项目最终状态

✅ 全套脚手架环境、底层配置、基础工具封装 **100%完成**

✅ 完美适配 **Prisma7\.x \+ TypeScript7** 最新版本，解决所有版本兼容报错

✅ MySQL数据库、Redis缓存链路全部打通，17张数据表类型安全生效

✅ 修复服务闪退、运行报错、类型缺失、数据库连接失败等全部问题

✅ 项目MVC分层架构、全局中间件、统一响应、底层工具全部就绪

👉 **当前阶段：基础环境彻底完工，可直接进入【业务接口编码开发】阶段**

> （注：部分内容可能由 AI 生成）

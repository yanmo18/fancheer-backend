# Fancheer Backend

> Fancheer 博主个人展示站后端 — 基于 Node.js + Express + Prisma 的 RESTful API 服务

## 项目概述

Fancheer 是一个**博主个人展示站**的后端服务：为单一创作者提供个人主页、作品展示、轻量留言互动和内容管理。提供用户认证、留言板、博主资料、音乐作品、活动日历等能力。

**项目范围**：不做多主播平台、直播推流、打赏、电商等敏感功能。详见 [docs/项目定位与范围.md](docs/项目定位与范围.md)。

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 20.x | 运行时环境 |
| Express | 5.x | Web 框架 |
| TypeScript | 7.x | 类型安全 |
| Prisma | 7.x | ORM |
| MySQL/MariaDB | 10.x | 数据库 |
| Redis | 7.x | 缓存/限流 |
| JWT | - | 身份认证 |
| bcryptjs | - | 密码加密 |
| multer | - | 文件上传 |
| sharp | - | 图片处理 |
| xss | - | XSS 过滤 |

## 目录结构

```
fancheer-backend/
├── src/
│   ├── app.ts                    # 应用入口
│   ├── routes/                   # 路由
│   ├── controllers/              # 控制器层
│   ├── services/                 # 服务层
│   ├── middlewares/              # 中间件
│   ├── config/                   # 配置文件
│   ├── utils/                    # 工具函数
│   ├── lib/prisma.ts             # Prisma 客户端
│   └── types/                    # TypeScript 类型
├── prisma/
│   ├── schema.prisma             # 数据库模型
│   └── migrations/               # 迁移文件
├── docs/                         # 项目文档（学习手册、开发 SOP、API 规范）
├── generated/prisma/             # Prisma 生成客户端（gitignore）
├── uploads/                      # 上传文件存储
├── .env.example                  # 环境变量模板
├── seed.ts                       # 数据库种子数据
└── package.json
```

## 快速开始

### 环境要求

- Node.js 20+
- MySQL/MariaDB 10+
- Redis 7+

### 安装与启动

```bash
pnpm install
cp .env.example .env          # 配置 DATABASE_URL、JWT_SECRET、Redis
pnpm prisma:gen               # 生成 Prisma Client
pnpm prisma:migrate           # 创建并应用迁移（首次输入名称 init）
pnpm seed                     # 导入种子数据（会清空所有表）
pnpm dev                      # 启动开发服务器 http://localhost:3000
```

验证：访问 `GET /api/health`，确认 MySQL 和 Redis 均为 ok。

### 测试账号

| 用户名 | 密码 | 代码角色 | 产品称呼 |
|--------|------|----------|----------|
| admin | 123456 | admin | 协管员 |
| streamer | 123456 | streamer | 博主/站主 |
| fan001 | 123456 | fan | 注册访客 |

### 其他命令

```bash
pnpm build              # 编译 TypeScript → dist/
pnpm start              # 生产启动
pnpm prisma:studio      # 可视化查看/编辑数据库
```

> Redis 用于缓存（验证码、JWT 黑名单、限流），**不能**用来查看 MySQL 数据表。查看数据请用 `pnpm prisma:studio`。

## 文档导航

| 文档 | 说明 |
|------|------|
| [docs/项目定位与范围.md](docs/项目定位与范围.md) | **产品边界**：做什么 / 不做什么 |
| [docs/README.md](docs/README.md) | 文档中心索引 |
| [docs/SOP-学习手册.md](docs/SOP-学习手册.md) | **零基础必读**，7 天学习计划 |
| [docs/SOP-开发流程.md](docs/SOP-开发流程.md) | 日常开发标准操作流程 |
| [docs/API-接口约定.md](docs/API-接口约定.md) | 前后端对接规范 + 接口速查表 |
| [docs/数据库指南.md](docs/数据库指南.md) | Schema、迁移、Seed |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | 历史变更记录 |

### 开发流程速览

1. 改代码 → `pnpm dev` 热重载 → Postman 测试
2. 新增接口：Service → Controller → Route → 注册到 `app.ts`（详见 [开发 SOP](docs/SOP-开发流程.md)）
3. 改数据库：编辑 `schema.prisma` → `pnpm prisma:migrate`

## 环境变量

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `PORT` | 否 | 3000 | HTTP 端口 |
| `DATABASE_URL` | **是** | - | MySQL 连接字符串 |
| `JWT_SECRET` | **是** | - | JWT 签名密钥，未配置时拒绝启动 |
| `REDIS_HOST` | 否 | localhost | Redis 主机 |
| `REDIS_PORT` | 否 | 6379 | Redis 端口 |
| `REDIS_PASSWORD` | 否 | 空 | Redis 密码 |
| `REDIS_DB` | 否 | 0 | Redis 数据库索引 |
| `CORS_ORIGIN` | 否 | 允许所有 | 生产 CORS 白名单，逗号分隔 |

完整说明见 [.env.example](.env.example)。

## 角色权限

| 角色 | 说明 | 权限范围 |
|------|------|----------|
| 游客 | 未登录用户 | 浏览首页（Banner、博主资料、荣誉、图集、活动、音乐、关系图谱） |
| fan | 注册访客 | 首页浏览 + 个人中心 + 留言互动 + 每日打卡 |
| admin | 协管员 | 访客权限 + 管理后台 + 上传，**不可查看全部私密留言** |
| streamer | 博主/站主 | 协管员权限 + 查看/回复私密留言 + **设置/取消协管员** |

> 代码中角色字段仍为 `fan` / `admin` / `streamer`，与上表产品称呼对应。

## 安全特性

- **JWT 认证**：7 天有效期，登出黑名单
- **XSS 过滤**：用户输入自动过滤
- **敏感词检测**：昵称、消息内容等字段
- **请求限流**：登录失败 60s 冷却，消息 20s/条
- **点赞幂等**：Redis 防重复
- **密码加密**：bcryptjs

## 响应格式

```json
{ "code": 0, "msg": "success", "data": { } }
{ "code": 400, "msg": "错误信息", "data": null }
```

- HTTP 状态码统一 200，错误通过 `code` 字段表达
- 字段 camelCase，ID 为字符串
- 完整规范见 [API 接口约定](docs/API-接口约定.md)

## 文件上传

- 图片：最大 10MB，自动压缩（质量 80%，最大宽度 1920px）
- 音频：最大 50MB
- 权限：admin / streamer
- 静态访问：`http://localhost:3000/uploads/<category>/<filename>`

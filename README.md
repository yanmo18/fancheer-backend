# Fancheer Backend

> Fancheer 粉丝官网后端服务 - 基于 Node.js + Express + Prisma 的 RESTful API 服务

## 📋 项目概述

Fancheer 是一个主播粉丝互动平台的后端服务，提供用户认证、聊天室、主播资料、音乐作品、活动管理等核心功能。

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 20.x | 运行时环境 |
| Express | 4.x | Web 框架 |
| TypeScript | 7.x | 类型安全 |
| Prisma | 7.x | ORM |
| MySQL/MariaDB | 10.x | 数据库 |
| Redis | 7.x | 缓存/限流 |
| JWT | - | 身份认证 |
| bcryptjs | - | 密码加密 |
| multer | - | 文件上传 |
| sharp | - | 图片处理 |
| xss | - | XSS 过滤 |

## 📁 目录结构

```
fancheer-backend/
├── src/
│   ├── app.ts                    # 应用入口
│   ├── routes/                   # 路由定义
│   │   ├── auth.route.ts         # 认证路由
│   │   ├── chat.route.ts         # 聊天室路由
│   │   ├── user.route.ts         # 用户路由
│   │   ├── admin.route.ts        # 管理后台路由
│   │   ├── banner.route.ts       # Banner路由
│   │   ├── streamer.route.ts     # 主播路由
│   │   ├── awards.route.ts       # 获奖记录路由
│   │   ├── songs.route.ts        # 音乐作品路由
│   │   ├── activities.route.ts   # 活动路由
│   │   ├── gallery.route.ts      # 图集路由
│   │   ├── upload.route.ts       # 上传路由
│   │   └── checkin.route.ts      # 打卡路由
│   ├── controllers/              # 控制器层
│   ├── services/                 # 服务层
│   ├── middlewares/              # 中间件
│   │   ├── auth.middleware.ts    # 认证中间件
│   │   ├── role.middleware.ts    # 角色权限中间件
│   │   ├── error.middleware.ts   # 错误处理中间件
│   │   └── cors.middleware.ts    # CORS中间件
│   ├── config/                   # 配置文件
│   │   ├── redis.ts              # Redis配置
│   │   └── upload.ts             # 上传配置
│   ├── utils/                    # 工具函数
│   │   ├── appError.ts           # 应用错误类
│   │   ├── response.ts           # 响应封装
│   │   ├── validate.ts           # 数据验证
│   │   ├── sanitize.ts           # XSS过滤
│   │   └── sensitiveWord.ts      # 敏感词过滤
│   ├── lib/                      # 库文件
│   │   └── prisma.ts             # Prisma客户端
│   └── types/                    # TypeScript类型定义
├── prisma/
│   ├── schema.prisma             # 数据库模型
│   └── prisma.config.ts          # Prisma配置
├── generated/
│   └── prisma/                   # 生成的Prisma客户端
├── uploads/                      # 上传文件存储目录
├── word/                         # 项目文档
├── package.json
├── tsconfig.json
├── .env                          # 环境变量
└── seed.ts                       # 数据库种子数据
```

## 🚀 快速开始

### 环境要求

- Node.js 20+
- MySQL/MariaDB 10+
- Redis 7+

### 安装依赖

```bash
npm install
```

### 环境配置

复制 `.env.example` 为 `.env`，修改数据库连接信息：

```env
PORT=3000
DATABASE_URL="mysql://user:password@localhost:3306/fancheer"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
```

### 数据库迁移

```bash
npx prisma migrate dev
```

### 生成种子数据

```bash
npm run seed
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 🔐 角色权限

| 角色 | 说明 | 权限范围 |
|------|------|----------|
| admin | 管理员 | 全部功能，管理后台 |
| streamer | 主播 | 聊天室、私密回复、上传音乐 |
| fan | 粉丝 | 聊天室、发送消息、点赞、打卡 |

## 📡 API 接口

### 认证模块

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/captcha` | GET | 获取图形验证码 |
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/logout` | POST | 用户登出 |

### 用户模块

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/users/profile` | GET | 获取用户信息 |
| `/api/users/profile` | PUT | 修改用户昵称 |
| `/api/users/avatar` | POST | 修改头像 |

### 聊天室模块

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/messages/public` | GET | 获取公开消息 |
| `/api/messages/public-replies` | GET | 获取主播公开回复 |
| `/api/messages/private` | GET | 获取私密消息 |
| `/api/messages` | POST | 发送消息 |
| `/api/messages/:id/like` | POST | 点赞消息 |
| `/api/messages/:id/like` | DELETE | 取消点赞 |
| `/api/messages/:id/report` | POST | 举报消息 |
| `/api/messages/:id/streamer-reply` | POST | 主播公开回复 |
| `/api/messages/:id/private-reply` | POST | 主播私密回复 |

### 管理后台模块

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/admin/banners` | GET/POST | Banner管理 |
| `/api/admin/banners/:id` | PUT/DELETE | Banner详情/删除 |
| `/api/admin/streamer-info` | GET/PUT | 主播资料管理 |
| `/api/admin/awards` | GET/POST | 获奖记录管理 |
| `/api/admin/songs` | GET/POST | 音乐作品管理 |
| `/api/admin/activities` | GET/POST | 活动管理 |
| `/api/admin/gallery` | GET/POST | 图集管理 |

### 上传模块

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/upload/image` | POST | 上传图片 |
| `/api/upload/audio` | POST | 上传音频 |

### 其他模块

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/checkin` | POST | 每日打卡 |
| `/api/checkin/history` | GET | 打卡历史 |

## 🗄️ 数据库设计

### 核心表结构

| 表名 | 说明 |
|------|------|
| users | 用户表 |
| avatars | 头像表 |
| messages | 消息表 |
| likes | 点赞表 |
| reports | 举报表 |
| private_replies | 私密回复表 |
| banners | Banner表 |
| streamer_info | 主播资料表 |
| awards | 获奖记录表 |
| songs | 音乐作品表 |
| activities | 活动表 |
| gallery_images | 图集表 |
| check_ins | 打卡表 |
| sensitive_words | 敏感词表 |
| admin_logs | 管理员操作日志 |

## 🔒 安全特性

- **JWT 认证**：无状态身份验证
- **XSS 过滤**：用户输入自动过滤
- **敏感词检测**：昵称等字段敏感词检查
- **请求限流**：消息发送频率限制（20秒/条）
- **点赞幂等**：防止重复点赞
- **密码加密**：bcryptjs 加密存储

## 📦 配置说明

### 文件上传限制

- 图片：最大 10MB，自动压缩至质量 80%，最大宽度 1920px
- 音频：最大 50MB

### 响应格式

成功响应：
```json
{
  "code": 0,
  "msg": "success",
  "data": { ... }
}
```

失败响应：
```json
{
  "code": 400,
  "msg": "错误信息",
  "data": null
}
```

---

## 📝 修改日志

### 2026-07-27 - 新增管理员设置功能

**修改文件：**
- [src/services/admin.service.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/services/admin.service.ts)
- [src/controllers/admin.controller.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/controllers/admin.controller.ts)
- [src/routes/admin.route.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/routes/admin.route.ts)
- [word/04-听潮阁-接口文档.md](file:///d:/Seren-item/Fancheer/fancheer-backend/word/04-听潮阁-接口文档.md)

**修改内容：**

**新增接口 `PUT /api/admin/users/:id/role`**：
- **功能**：主播可以将粉丝设为管理员，或取消管理员权限
- **权限**：仅 streamer（主播）可调用
- **参数**：`id`（目标用户ID）、`role`（目标角色，仅允许 `admin` 或 `fan`）

**业务逻辑：**
1. 校验 `role` 参数值，仅允许 `"admin"` 或 `"fan"`
2. 校验目标用户存在
3. 校验不能修改 `streamer` 角色的用户
4. 校验不能修改自己的角色
5. 幂等检查：目标角色与当前角色相同时直接返回成功
6. 更新 `users.role` 字段
7. 写入 `admin_logs`（action: `promote_admin` 或 `demote_admin`）

**修改原因：**
- 之前管理员只能由数据库手动修改，无法通过后台界面操作
- 主播需要灵活地授权/撤销信任粉丝的管理权限

**完成成就：**
- ✅ 新增管理员设置接口实现
- ✅ 完整的权限校验（仅主播可操作，不能修改主播角色，不能修改自己）
- ✅ 幂等操作支持
- ✅ 操作日志记录
- ✅ 接口文档更新
- ✅ TypeScript编译测试通过

---

### 2026-07-27 - 权限配置全面检查 & 接口文档完善

**修改文件：**
- [word/04-听潮阁-接口文档.md](file:///d:/Seren-item/Fancheer/fancheer-backend/word/04-听潮阁-接口文档.md)
- [src/routes/chat.route.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/routes/chat.route.ts)

**修改内容：**

**权限配置检查结果（全部正确）：**

| 角色 | 可访问接口 | 权限配置 | 状态 |
|------|-----------|---------|------|
| 游客 | `/api/banners`, `/api/streamer-info`, `/api/awards`, `/api/songs`, `/api/activities`, `/api/gallery`, `/api/graph`, `/api/auth/captcha`, `/api/auth/register`, `/api/auth/login` | 无登录要求 | ✅ |
| 注册粉丝 | 游客全部 + `/api/user/*`, `/api/checkin/*`, `/api/messages/*`（除主播专用） | `authMiddleware` | ✅ |
| 管理员 | 粉丝全部 + `/api/admin/*`, `/api/upload/*` | `authMiddleware + requireRole(['admin', 'streamer'])` | ✅ |
| 主播 | 管理员全部 + `/api/messages/:id/streamer-reply`, `/api/messages/:id/private-reply` | `authMiddleware + requireRole(['streamer'])` | ✅ |

**特殊权限验证：**
- ✅ 管理员无法查看私密消息（`/api/admin/messages/private` 仅 streamer 可访问）
- ✅ 私密回复默认公开展示（`is_public: true`），全员可见但隐藏发送者身份
- ✅ 聊天室所有接口需要登录（游客无法进入）

**文档更新：**
1. **新增接口文档 `10.2 获取主播公开回复列表（全员可见）`**：补充 `/api/messages/public-replies` 接口定义，描述主播私密回复的匿名公开展示机制
2. **调整接口编号**：因新增接口，原10.2-11.3编号调整为10.3-11.4

**修改原因：**
- 接口文档缺少 `/api/messages/public-replies` 的定义，但代码已实现
- 需要确保文档与代码完全一致，前端开发有明确的接口规范

**完成成就：**
- ✅ 所有路由权限配置正确，符合PRD角色矩阵
- ✅ 私密消息权限逻辑正确（主播可见，管理员不可见，回复全员可见）
- ✅ 接口文档与代码完全一致
- ✅ TypeScript编译测试通过

---

### 2026-07-27 - 文档与代码一致性检查 & 冗余清理

**修改文件：**
- [src/services/user.service.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/services/user.service.ts)
- [src/controllers/user.controller.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/controllers/user.controller.ts)
- [src/routes/user.route.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/routes/user.route.ts)
- [word/04-后端底层基建、通用工具、中间件完整手册...md](file:///d:/Seren-item/Fancheer/fancheer-backend/word/04-后端底层基建、通用工具、中间件完整手册（归属 + 源码 + 作用全解）【对齐最新V1.1接口文档】.md)

**修改内容：**

**代码修复：**
1. **修复 `user.service.ts` 中 `getPrivateReplies` 缺少 `is_public` 过滤**：添加 `is_public: true` 条件，确保只返回主播公开发布的回复，与接口文档一致
2. **删除 `user.service.ts` 中 `updateNickname` 的冗余敏感词检查**：控制器层已通过 `checkSensitiveWord()` 检查，服务层重复查询数据库，删除后减少一次数据库查询
3. **删除冗余接口 `GET /api/user/private-replies`**：与 `GET /api/messages/private` 功能重复，统一使用接口文档定义的 `/api/messages/private` 接口

**文档更新：**
1. **更新后端基建文档中上传路由描述**：将"图片Base64上传"改为"图片/音频multipart/form-data上传，支持压缩"，与实际代码一致

**修改原因：**
- 文档与代码描述不一致，需要统一对齐
- `getPrivateReplies` 缺少 `is_public` 过滤会导致粉丝看到未公开的回复
- 用户模块和聊天室模块都有获取私密回复的接口，造成功能重复
- `updateNickname` 中控制器和服务层重复检查敏感词，浪费数据库资源

**完成成就：**
- ✅ 文档与代码描述一致
- ✅ 私密回复查询逻辑正确（只返回公开回复）
- ✅ 冗余接口删除，统一使用接口文档定义的路径
- ✅ 敏感词检查只在控制器层执行，减少一次数据库查询
- ✅ TypeScript编译测试通过

---

### 2026-07-27 - 聊天窗口登录限制 & 完善项目文档

**修改文件：**
- [src/routes/chat.route.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/routes/chat.route.ts)
- [src/services/chat.service.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/services/chat.service.ts)
- [src/controllers/chat.controller.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/controllers/chat.controller.ts)
- [README.md](file:///d:/Seren-item/Fancheer/fancheer-backend/README.md)

**修改内容：**
- 所有聊天室接口添加 `authMiddleware`，游客必须登录才能使用聊天窗口功能
- 新增 `getPublicReplies` 接口，获取主播对私密消息的公开回复（全员可见，匿名展示原消息）
- 完善 README.md，添加项目概述、技术栈、目录结构、环境配置、启动方式、功能模块等详细信息

**修改原因：**
- 产品需求：游客必须登录才能使用聊天窗口功能
- 主播私密回复需要对所有登录用户可见（匿名形式展示原消息）
- README 需要包含完整的项目文档信息，不止更改日志

**完成成就：**
- ✅ 聊天室接口登录限制实现
- ✅ 主播公开回复接口实现
- ✅ 私密消息匿名公开展示功能完善
- ✅ README.md 完善，包含项目详细信息

---

### 2026-07-26 - 修改私密消息功能：主播私密回复全员可见（匿名展示）

**修改文件：**
- [prisma/schema.prisma](file:///d:/Seren-item/Fancheer/fancheer-backend/prisma/schema.prisma)
- [src/services/chat.service.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/services/chat.service.ts)
- [src/controllers/chat.controller.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/controllers/chat.controller.ts)
- [word/01-Fancheer粉丝官网-PRD-V2.md](file:///d:/Seren-item/Fancheer/fancheer-backend/word/01-Fancheer粉丝官网-PRD-V2.md)
- [word/04-Fancheer-接口文档.md](file:///d:/Seren-item/Fancheer/fancheer-backend/word/04-Fancheer-接口文档.md)
- [word/04-后端底层基建、通用工具、中间件完整手册...md](file:///d:/Seren-item/Fancheer/fancheer-backend/word/04-后端底层基建、通用工具、中间件完整手册（归属 + 源码 + 作用全解）【对齐最新V1.1接口文档】.md)

**修改内容：**

**数据库变更：**
- private_replies 表新增 `is_public` 字段（Boolean，默认false）
- 数据库执行：`ALTER TABLE private_replies ADD COLUMN is_public TINYINT(1) DEFAULT 0;`

**业务逻辑变更：**
1. **接口11.2（主播私密回复）**：默认 `is_public = true`，回复公开展示
2. **接口10.2（粉丝获取私密消息）**：改为查询 `private_replies WHERE target_user_id = 当前用户 AND is_public = 1`，返回主播对自己的公开回复（匿名版）
3. **接口2.4（获取主播对我的私密回复）**：与10.2合并，已废弃

**返回数据变更：**
- 粉丝获取私密消息接口新增：`messageId`、`originalContent`（匿名原消息）、`streamerId`、`streamerNickname`、`streamerAvatar`
- 不再返回发送者（粉丝）身份信息

**修改原因：**
- 原设计：私密回复仅 target_user + streamer 可见
- 新设计：主播私密回复全员可见（匿名展示原消息内容，隐藏发送者身份）
- 满足"粉丝发私密消息→只有主播能看到，主播公开回复→全体粉丝可见"的产品需求

**完成成就：**
- ✅ 数据库新增 is_public 字段
- ✅ 主播私密回复默认公开
- ✅ 粉丝获取私密消息改为获取主播对自己的公开回复（匿名版）
- ✅ 原消息内容匿名展示，保护粉丝隐私
- ✅ PRD文档、接口文档、后端基建文档同步更新

---

### 2026-07-26 - 修改问题2：BigInt/Number精度隐患

**修改文件：**
- [src/app.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/app.ts)

**修改内容：**
- 在应用入口添加 BigInt 的 JSON 序列化支持：
  ```typescript
  (BigInt.prototype as any).toJSON = function () { return this.toString() }
  ```

**修改原因：**
- schema.prisma 中所有主键使用 BigInt @db.UnsignedBigInt
- JavaScript 的 Number 安全整数上限是 2^53，大 ID 可能导致精度丢失
- 之前代码中到处使用 Number(id) 转换，存在隐患

**完成成就：**
- ✅ 所有 BigInt 在 JSON.stringify 时自动转为字符串
- ✅ 前端收到的 id 都是字符串类型，不会有精度问题
- ✅ 无需修改任何 controller/service，一行代码全局解决

---

### 2026-07-26 - 修改问题4：缺XSS过滤 & 问题5：缺敏感词过滤

**修改文件：**
- [src/utils/sanitize.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/utils/sanitize.ts) (新建)
- [src/utils/sensitiveWord.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/utils/sensitiveWord.ts) (新建)
- [src/app.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/app.ts)
- [src/controllers/user.controller.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/controllers/user.controller.ts)
- [src/controllers/banner.controller.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/controllers/banner.controller.ts)
- [src/controllers/streamer.controller.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/controllers/streamer.controller.ts)
- [src/controllers/awards.controller.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/controllers/awards.controller.ts)
- [src/controllers/songs.controller.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/controllers/songs.controller.ts)
- [src/controllers/activities.controller.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/controllers/activities.controller.ts)
- [src/controllers/chat.controller.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/controllers/chat.controller.ts)
- [src/controllers/admin.controller.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/controllers/admin.controller.ts)

**修改内容：**

**问题4：XSS过滤**
- 创建 `src/utils/sanitize.ts`，封装 `sanitize()` 和 `sanitizeObject()` 工具函数
- 使用已安装的 `xss` 包对用户输入进行过滤
- 在所有controller中对以下字段进行XSS过滤：title、content、nickname、bio、reason、linkUrl、name、tags、description、keyword、word

**问题5：敏感词过滤**
- 创建 `src/utils/sensitiveWord.ts`，封装 `loadSensitiveWords()` 和 `checkSensitiveWord()` 工具函数
- 应用启动时从数据库加载敏感词到内存缓存
- 在修改昵称接口中添加敏感词检查，包含敏感词时返回错误

**修改原因：**
- 接口文档要求修改昵称、新增Banner、编辑主播资料等接口需要进行XSS过滤
- 接口文档2.1修改昵称明确要求查询sensitive_words表进行敏感词匹配
- 之前代码中已安装xss包但未使用，敏感词过滤完全缺失

**完成成就：**
- ✅ 创建XSS过滤工具函数
- ✅ 创建敏感词过滤工具函数（支持内存缓存）
- ✅ 所有controller中添加XSS过滤
- ✅ 修改昵称接口添加敏感词过滤
- ✅ 应用启动时预加载敏感词到内存，提高性能

---

### 2026-07-26 - 项目名称统一："听潮阁"替换为"Fancheer"

**修改文件：**
- word目录下所有文档（04-Fancheer-接口文档.md、04-后端底层基建...md、02-PRD_Fancheer-ER图.drawio、01-Fancheer粉丝官网-PRD-V2.md、02-Fancheer-建表SQL.sql）
- [README.md](file:///d:/Seren-item/Fancheer/fancheer-backend/README.md)

**修改内容：**
- 将所有文件中的"听潮阁"替换为"Fancheer"

**修改原因：**
- 项目名称统一为Fancheer，避免名称不一致

**完成成就：**
- ✅ 所有文档和文件中的"听潮阁"已替换为"Fancheer"

---

### 2026-07-26 - 修改问题3：HTTP状态码不一致

**修改文件：**
- [src/middlewares/error.middleware.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/middlewares/error.middleware.ts)

**修改内容：**
- 将全局异常处理中间件中所有错误响应的 HTTP 状态码统一改为 200
- 修改前：`res.status(err.code)` 返回真实 HTTP 状态码（401/403/404 等）
- 修改后：`res.status(200)` 统一返回 HTTP 200，错误信息通过响应体中的 `code` 字段表达

**修改原因：**
- 接口文档约定：所有错误都通过 code 字段表达，HTTP 统一 200
- 之前 `error.middleware.ts` 返回真实 HTTP 状态码，而 `auth.middleware.ts` 和 controller 里使用 `res.json(fail(...))` 返回 HTTP 200，导致前后不一致
- 统一为 HTTP 200 + body code 字段模式，符合接口文档约定，便于前端统一处理

**完成成就：**
- ✅ 全局异常处理中间件错误响应 HTTP 状态码统一为 200
- ✅ 符合接口文档约定，与 controller 层响应格式一致

---

### 2026-07-26 - 修改后台CRUD模块admin_id硬编码问题

**修改文件：**
- [src/services/banner.service.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/services/banner.service.ts)
- [src/controllers/banner.controller.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/controllers/banner.controller.ts)
- [src/services/awards.service.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/services/awards.service.ts)
- [src/controllers/awards.controller.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/controllers/awards.controller.ts)
- [src/services/songs.service.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/services/songs.service.ts)
- [src/controllers/songs.controller.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/controllers/songs.controller.ts)
- [src/services/activities.service.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/services/activities.service.ts)
- [src/controllers/activities.controller.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/controllers/activities.controller.ts)
- [src/services/gallery.service.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/services/gallery.service.ts)
- [src/controllers/gallery.controller.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/controllers/gallery.controller.ts)
- [src/services/streamer.service.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/services/streamer.service.ts)
- [src/controllers/streamer.controller.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/controllers/streamer.controller.ts)

**修改内容：**
- Service 层：每个 CRUD 方法增加 `adminId: number` 参数，写入 `admin_logs` 时使用 `admin_id: adminId`
- Controller 层：导入 `UserRequest` 类型，将 `req` 参数类型从 `Request` 改为 `UserRequest`，调用 service 时传入 `req.user.id`

**修改原因：**
- 之前 `admin_id` 硬编码为 1，无法记录实际操作用户
- 需求要求从 controller 传入 adminId，记录真实的管理员操作日志

**完成成就：**
- ✅ 6个后台CRUD模块的admin_id硬编码问题全部修复
- ✅ TypeScript编译测试通过
- ✅ chat.service.ts的privateReply方法已确认无需修改（已使用admin_id: userId）

---

### 之前修改记录（接口文档与代码一致性优化）

**修改文件：**
- [word/04-Fancheer-接口文档.md](file:///d:/Seren-item/Fancheer/fancheer-backend/word/04-Fancheer-接口文档.md)
- [word/04-后端底层基建、通用工具、中间件完整手册.md](file:///d:/Seren-item/Fancheer/fancheer-backend/word/04-后端底层基建、通用工具、中间件完整手册（归属 + 源码 + 作用全解）【对齐最新V1.1接口文档】.md)
- [word/03-Fancheer后端脚手架搭建手册.md](file:///d:/Seren-item/Fancheer/fancheer-backend/word/03-Fancheer后端 fancheer-backend 脚手架完整从零搭建步骤+最终适配版.md)
- [src/services/upload.service.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/services/upload.service.ts)
- [src/controllers/upload.controller.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/controllers/upload.controller.ts)
- [src/routes/upload.route.ts](file:///d:/Seren-item/Fancheer/fancheer-backend/src/routes/upload.route.ts)
- [package.json](file:///d:/Seren-item/Fancheer/fancheer-backend/package.json)

**修改内容：**
- 修正接口路径不一致问题（聊天室、举报、打卡等接口）
- 图片上传从Base64方式改为multipart/form-data，使用multer和sharp处理
- 恢复multer和sharp依赖
- 修正Redis Key格式符合文档要求
- 新增缺少的接口（取消点赞、主播回复、文件上传等）

**修改原因：**
- 接口文档与实际代码不一致，需要对齐
- Base64方式不适合大文件上传，需要使用multipart/form-data
- 缺少文档中定义的部分接口

**完成成就：**
- ✅ 接口文档与代码一致性优化完成
- ✅ 文件上传功能支持multipart/form-data
- ✅ 图片自动压缩功能实现
- ✅ 所有缺失接口已补充

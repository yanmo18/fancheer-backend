# 修改日志

> Fancheer Backend 历史变更记录。最新文档见 [docs/README.md](./README.md)。

---

## 2026-07-29（二）- 安全加固 & 学习文档

**代码修改：**
- `src/utils/pagination.ts` — 分页参数校验，`pageSize` 上限 20
- `src/services/auth.service.ts` — 登录失败 60 秒限流
- `src/controllers/chat.controller.ts` — 消息/回复敏感词过滤
- `src/routes/health.route.ts` — 新增 `GET /api/health`
- `src/app.ts` — CORS 支持 `CORS_ORIGIN` 环境变量
- `seed.ts` — 复用 `src/lib/prisma`，去除重复初始化
- 删除无用文件 `query`

**文档修改：**
- 新增学习手册（后迁移至 `docs/SOP-学习手册.md`）
- 更新接口文档 V1.2（Redis Key、camelCase、ID 类型、健康检查）
- README 增加学习文档索引

---

## 2026-07-29 - 代码质量修复 & 文档同步

**修改文件：**
- `src/services/songs.service.ts` — 删除不存在的 `updated_at` 写入
- `src/services/chat.service.ts` — 拆分点赞/取消点赞 Redis 幂等键；统一以 `likes` 表计数
- `src/services/auth.service.ts`、`src/config/jwt.ts`、`src/types/index.ts`、`src/utils/id.ts` — JWT userId 改为字符串，全链路 BigInt 安全
- `src/middlewares/auth.middleware.ts` — 鉴权时校验用户封禁状态
- `src/services/upload.service.ts`、`src/routes/upload.route.ts` — 上传 category 白名单；图片 10MB / 音频 50MB 分离限制；输出统一 `.jpg`
- `src/services/admin.service.ts` — 敏感词增删后刷新缓存；删除头像前检查引用；操作日志 camelCase
- `src/services/checkin.service.ts` — 打卡日期改用 `Asia/Shanghai` 时区
- `src/services/graph.service.ts` — 补充 admin_logs；响应统一 camelCase
- `src/controllers/graph.controller.ts` — 补充 XSS 过滤
- `src/services/banner|awards|songs|activities|gallery|streamer.service.ts` — 去除 snake_case 字段泄漏
- `src/config/constants.ts`、`src/utils/validate.ts`、`src/utils/response.ts` — 集中常量、统一 fail 返回 `data: null`
- 全部 controllers — 使用 `parseId` / `userIdFromRequest` 替代 `Number(id)`
- `.env.example`（新增）、`README.md`

**修改内容：**
1. 修复 songs 更新接口运行时 Prisma 字段错误
2. 修复点赞/取消点赞 1 秒内 Redis 键冲突导致的状态不一致
3. 修复 JWT BigInt 精度丢失隐患
4. 修复封禁用户仍可使用旧 Token 的问题
5. 修复上传 category 路径穿越风险
6. 修复敏感词后台增删后不生效的问题
7. 统一 API 响应 camelCase，去除 Prisma snake_case 泄漏
8. 修复打卡 UTC 时区偏差
9. Graph 模块补充 XSS 过滤与操作日志
10. 同步 README 目录结构、迁移说明、Redis/MySQL 职责说明

---

## 2026-07-27 - 新增管理员设置功能

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

---

## 2026-07-27 - 权限配置全面检查 & 接口文档完善

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

---

## 2026-07-27 - 文档与代码一致性检查 & 冗余清理

**代码修复：**
1. **修复 `user.service.ts` 中 `getPrivateReplies` 缺少 `is_public` 过滤**
2. **删除 `user.service.ts` 中 `updateNickname` 的冗余敏感词检查**
3. **删除冗余接口 `GET /api/user/private-replies`**

---

## 2026-07-27 - 聊天窗口登录限制 & 完善项目文档

- 所有聊天室接口添加 `authMiddleware`，游客必须登录才能使用聊天窗口功能
- 新增 `getPublicReplies` 接口，获取主播对私密消息的公开回复（全员可见，匿名展示原消息）
- 完善 README.md，添加项目概述、技术栈、目录结构、环境配置、启动方式、功能模块等详细信息

---

## 2026-07-26 - 修改私密消息功能：主播私密回复全员可见（匿名展示）

**数据库变更：**
- private_replies 表新增 `is_public` 字段（Boolean，默认 false）

**业务逻辑变更：**
1. **主播私密回复**：默认 `is_public = true`，回复公开展示
2. **粉丝获取私密消息**：改为查询主播对自己的公开回复（匿名版）
3. 不再返回发送者（粉丝）身份信息

---

## 2026-07-26 - 修改问题2：BigInt/Number 精度隐患

- 在应用入口添加 BigInt 的 JSON 序列化支持：
  ```typescript
  (BigInt.prototype as any).toJSON = function () { return this.toString() }
  ```

---

## 2026-07-26 - 修改问题4：缺 XSS 过滤 & 问题5：缺敏感词过滤

- 创建 `src/utils/sanitize.ts`，封装 XSS 过滤
- 创建 `src/utils/sensitiveWord.ts`，封装敏感词过滤（内存缓存）
- 应用启动时从数据库加载敏感词到内存

---

## 2026-07-26 - 项目名称统一："听潮阁"替换为 "Fancheer"

- 将所有文件中的"听潮阁"替换为"Fancheer"

---

## 2026-07-26 - 修改问题3：HTTP 状态码不一致

- 将全局异常处理中间件中所有错误响应的 HTTP 状态码统一改为 200
- 错误信息通过响应体中的 `code` 字段表达

---

## 2026-07-26 - 修改后台 CRUD 模块 admin_id 硬编码问题

- Service 层：每个 CRUD 方法增加 `adminId` 参数，写入 `admin_logs` 时使用真实 admin_id
- Controller 层：调用 service 时传入 `req.user.id`

---

## 之前修改记录（接口文档与代码一致性优化）

- 修正接口路径不一致问题（聊天室、举报、打卡等接口）
- 图片上传从 Base64 方式改为 multipart/form-data，使用 multer 和 sharp 处理
- 修正 Redis Key 格式符合文档要求
- 新增缺少的接口（取消点赞、主播回复、文件上传等）

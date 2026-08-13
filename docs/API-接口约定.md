# API 接口约定

> Fancheer Backend 前后端对接规范与接口速查表。
>
> **项目定位**：博主个人展示站（单一创作者）。代码中 `streamer` 角色 = 博主/站主，`streamer_info` = 博主资料。不做直播、打赏、电商。

## 基础信息

| 项目 | 值 |
|------|-----|
| Base URL（开发） | `http://localhost:3000` |
| 协议 | HTTP/HTTPS |
| 数据格式 | JSON（上传接口除外） |
| 字符编码 | UTF-8 |

## 认证

需要登录的接口，请求头携带 JWT：

```
Authorization: Bearer <token>
```

- Token 在 `POST /api/auth/login` 成功后返回
- 有效期：**7 天**
- 登出后 Token 的 `jti` 写入 Redis 黑名单，立即失效

## 统一响应格式

所有接口 HTTP 状态码均为 **200**，通过 body 中的 `code` 字段区分成功与失败。

### 成功响应

```json
{
  "code": 0,
  "msg": "success",
  "data": { }
}
```

### 失败响应

```json
{
  "code": 400,
  "msg": "错误信息",
  "data": null
}
```

### 错误码表

| code | 含义 | 典型场景 |
|------|------|----------|
| 0 | 成功 | 正常返回 |
| 400 | 请求参数错误 | 校验失败、验证码错误 |
| 401 | 未认证 | Token 缺失/过期/无效 |
| 403 | 无权限 | 角色不足、账号被封禁 |
| 404 | 资源不存在 | ID 无效、记录未找到 |
| 409 | 冲突 | 用户名已存在、重复操作 |
| 429 | 请求过于频繁 | 登录限流、消息发送限流 |
| 500 | 服务器内部错误 | 未预期的异常 |

### 字段命名约定

- API 响应字段统一使用 **camelCase**（如 `imageUrl`、`createdAt`）
- ID 字段为 **字符串**（数据库 BigInt 序列化，避免 JS 精度丢失）
- 日期时间格式：ISO 8601 字符串

## 分页

### 标准分页（管理后台列表）

Query 参数：

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `page` | number | 1 | 页码，从 1 开始 |
| `pageSize` | number | 20 | 每页条数，**最大 20** |

响应 `data` 结构：

```json
{
  "list": [ ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 游标分页（公开消息列表）

Query 参数：

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `before` | string | - | 上一页最后一条消息的 ID |
| `limit` | number | 20 | 每页条数，**最大 20** |

## 文件上传

### 上传图片 `POST /api/upload/image`

- **权限**：admin / streamer
- **Content-Type**：`multipart/form-data`
- **字段**：
  - `file`（必填）：图片文件
  - `category`（必填）：分类，白名单见下表

| category | 用途 |
|----------|------|
| `images` | 通用图片 |
| `banners` | Banner 轮播图 |
| `avatars` | 头像池 |
| `gallery` | 图集 |
| `awards` | 获奖记录 |
| `activities` | 活动封面 |
| `graph` | 关系图谱 |
| `songs` | 音乐封面 |

- **限制**：最大 10MB，支持 jpg/jpeg/png/webp/gif
- **处理**：自动压缩（质量 80%，最大宽度 1920px），输出 `.jpg`
- **返回**：`{ "url": "/uploads/<category>/<uuid>.jpg" }`

### 上传音频 `POST /api/upload/audio`

- **权限**：admin / streamer
- **字段**：`file`（必填）
- **限制**：最大 50MB，支持 mp3/wav/ogg
- **返回**：`{ "url": "/uploads/audio/<uuid>.<ext>" }`

### 静态文件访问

上传后的文件通过以下 URL 直接访问：

```
http://localhost:3000/uploads/<category>/<filename>
```

## 健康检查

### `GET /api/health`

无需认证。返回示例：

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "mysql": "ok",
    "redis": "ok"
  }
}
```

---

## 接口速查表

### 系统模块

| 接口 | 方法 | 说明 |
|------|------|------|
| `/` | GET | 服务运行状态 |
| `/api/health` | GET | 健康检查（MySQL + Redis 连通性） |

### 认证模块

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/captcha` | GET | 获取图形验证码 |
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/logout` | POST | 用户登出（需要登录） |
| `/api/auth/me` | GET | 获取当前用户信息（需要登录） |

#### 注册请求体

```json
{
  "username": "fan002",
  "password": "123456",
  "captchaId": "uuid-from-captcha",
  "captchaText": "abcd"
}
```

#### 登录请求体

```json
{
  "username": "fan001",
  "password": "123456"
}
```

#### 登录成功响应

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "1",
      "username": "fan001",
      "nickname": "访客小明",
      "role": "fan",
      "avatarUrl": null
    }
  }
}
```

### 用户模块

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/user/nickname` | PUT | 修改展示昵称（需要登录） |
| `/api/user/avatar` | PUT | 选择系统头像（需要登录） |
| `/api/user/avatars` | GET | 获取系统头像池（需要登录） |

### 首页展示模块（游客可访问）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/banners` | GET | 获取 Banner 列表 |
| `/api/streamer-info` | GET | 获取博主资料 |
| `/api/awards` | GET | 获取获奖记录列表 |
| `/api/songs` | GET | 获取音乐作品列表 |
| `/api/activities` | GET | 获取活动日历列表 |
| `/api/gallery` | GET | 获取图集列表（`?category=anime` 或 `real`） |
| `/api/graph` | GET | 获取关系图谱 |

### 聊天室模块（需要登录）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/messages/public` | GET | 获取公开消息列表 |
| `/api/messages/public-replies` | GET | 获取博主公开回复（全员可见） |
| `/api/messages/private` | GET | 获取我的私密消息（仅粉丝） |
| `/api/messages` | POST | 发送消息（公开/私密） |
| `/api/messages/:id/like` | POST | 点赞消息 |
| `/api/messages/:id/like` | DELETE | 取消点赞 |
| `/api/messages/:id/report` | POST | 举报消息 |
| `/api/messages/:id/streamer-reply` | POST | 博主发送公开回复（仅 streamer 角色） |
| `/api/messages/:id/private-reply` | POST | 博主发送私密回复（仅 streamer 角色） |
| `/api/messages/:id/private-replies` | GET | 获取某消息的回复列表 |

#### 发送消息请求体

```json
{
  "content": "你好 Fancheer！",
  "type": "public"
}
```

`type` 可选值：`public`（公开留言）| `private`（私密留言，仅博主可见）

### 打卡模块（需要登录）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/checkin` | POST | 每日打卡 |
| `/api/checkin/calendar` | GET | 获取打卡日历（`?year=2026&month=8`） |

### 管理后台模块（需要登录，admin/streamer）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/admin/users` | GET | 获取用户列表 |
| `/api/admin/users/:id/ban` | PUT | 封禁用户 |
| `/api/admin/users/:id/unban` | PUT | 解封用户 |
| `/api/admin/users/:id/role` | PUT | 设置/取消协管员（仅 streamer 角色） |
| `/api/admin/banners` | GET/POST | Banner 列表/新增 |
| `/api/admin/banners/:id` | PUT/DELETE | Banner 编辑/删除 |
| `/api/admin/streamer-info` | GET/PUT | 博主资料查看/编辑 |
| `/api/admin/awards` | GET/POST | 获奖记录列表/新增 |
| `/api/admin/awards/:id` | PUT/DELETE | 获奖记录编辑/删除 |
| `/api/admin/songs` | GET/POST | 音乐作品列表/新增 |
| `/api/admin/songs/:id` | PUT/DELETE | 音乐作品编辑/删除 |
| `/api/admin/activities` | GET/POST | 活动列表/新增 |
| `/api/admin/activities/:id` | PUT/DELETE | 活动编辑/删除 |
| `/api/admin/gallery` | GET/POST | 图集列表/新增 |
| `/api/admin/gallery/:id` | PUT/DELETE | 图集编辑/删除 |
| `/api/admin/graph/characters` | GET/POST | 图谱人物列表/新增 |
| `/api/admin/graph/characters/:id` | PUT/DELETE | 图谱人物编辑/删除 |
| `/api/admin/graph/relations` | GET/POST | 关系连线列表/新增 |
| `/api/admin/graph/relations/:id` | PUT/DELETE | 关系连线编辑/删除 |
| `/api/admin/messages/public` | GET | 获取全部公开消息 |
| `/api/admin/messages/private` | GET | 获取全部私密留言（仅 streamer 角色） |
| `/api/admin/messages/:id` | DELETE | 删除消息 |
| `/api/admin/reports/pending` | GET | 获取待处理举报工单 |
| `/api/admin/reports/resolved` | GET | 获取已办结举报工单 |
| `/api/admin/reports/:id` | GET | 查看举报工单详情 |
| `/api/admin/reports/:id/resolve` | PUT | 标记举报工单为办结 |
| `/api/admin/reports/:id/message` | DELETE | 删除被举报的违规消息 |
| `/api/admin/avatars` | GET/POST | 头像池列表/新增 |
| `/api/admin/avatars/:id` | DELETE | 删除头像 |
| `/api/admin/sensitive-words` | GET/POST | 敏感词列表/新增 |
| `/api/admin/sensitive-words/:id` | DELETE | 删除敏感词 |
| `/api/admin/logs` | GET | 获取操作日志 |

### 上传模块（需要登录，admin/streamer）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/upload/image` | POST | 上传图片 |
| `/api/upload/audio` | POST | 上传音频 |

## 限流与安全

| 场景 | 规则 |
|------|------|
| 登录失败 | 同一用户名 60 秒内不可再次尝试 |
| 发送消息 | 同一用户 20 秒内只能发 1 条 |
| 点赞/取消点赞 | Redis 幂等键，1 秒内防重复 |
| 验证码 | 5 分钟过期，一次性使用 |
| XSS | 用户输入自动过滤（title、content、nickname 等） |
| 敏感词 | 昵称、消息内容等字段检测 |

## Redis Key 模式

| 用途 | Key 格式 | TTL |
|------|----------|-----|
| 验证码 | `{captchaId}:svg_captcha` | 300s |
| JWT 黑名单 | `jwt_blacklist:{jti}` | 至 Token 过期 |
| 消息限流 | `rate_limit:msg:{userId}` | 20s |
| 登录限流 | `rate_limit:login:{username}` | 60s |
| 点赞幂等 | `like:add/remove:{userId}:{messageId}` | 1s |

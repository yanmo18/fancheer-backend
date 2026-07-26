# Fancheer Backend - 修改日志

## 修改记录

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

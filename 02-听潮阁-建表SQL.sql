-- ============================================================================
-- 听潮阁虚拟主播粉丝官网 - MySQL 建表脚本
-- 版本：V1.0（基于PRD V2.0）
-- 日期：2026-07-22
-- 引擎：InnoDB | 字符集：utf8mb4 | 排序规则：utf8mb4_unicode_ci
-- ============================================================================

-- ============================================================================
-- Redis 用途说明
-- ============================================================================
-- 1. 验证码存储（svg-captcha）：
--    key = sess_id:svg_captcha, value = 验证码文本, TTL = 5min
--    用途：注册页抵御批量注册，纯后端生成 SVG 零成本
--
-- 2. 点赞幂等控制：
--    key = like:{user_id}:{message_id}, value = 1, TTL = 1s
--    用途：同一用户对同一消息 1s 内重复点赞/取消请求直接忽略
--
-- 3. 消息发送冷却（限流）：
--    key = rate_limit:msg:{user_id}, value = 1, TTL = 20s
--    用途：公开/私密消息统一 20 秒发送冷却
--
-- 4. JWT 黑名单：
--    key = jwt_blacklist:{jti}, value = 1, TTL = JWT 剩余有效期
--    用途：用户登出或封禁后使已签发的 JWT 立即失效
-- ============================================================================

-- ============================================================================
-- 建表顺序（按外键依赖关系排列）
-- ============================================================================
-- 第1层（无依赖）：avatars, banners, streamer_info, awards, gallery_images,
--                   songs, activities, graph_characters, sensitive_words
-- 第2层（依赖第1层）：users → avatars
-- 第3层（依赖第2层）：graph_relations → graph_characters
--                     messages → users
--                     check_ins → users
--                     admin_logs → users
-- 第4层（依赖第3层）：private_replies → messages, users
--                     likes → users, messages
--                     reports → users, messages
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. avatars - 系统头像池表（管理员/主播上传，粉丝选用）
-- --------------------------------------------------------------------------
CREATE TABLE `avatars` (
  `id`            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '头像ID，主键',
  `url`           VARCHAR(500)     NOT NULL                COMMENT '头像图片URL（上传后自动压缩）',
  `sort_order`    INT              NOT NULL DEFAULT 0      COMMENT '排序权重，越大越靠前',
  `created_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统头像池表';


-- --------------------------------------------------------------------------
-- 2. banners - Banner管理表（首页顶部通栏）
-- --------------------------------------------------------------------------
CREATE TABLE `banners` (
  `id`            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT 'Banner ID，主键',
  `title`         VARCHAR(100)     NOT NULL DEFAULT ''     COMMENT 'Banner标题（可选）',
  `image_url`     VARCHAR(500)     NOT NULL                COMMENT 'Banner图片URL（上传后自动压缩）',
  `link_url`      VARCHAR(500)     DEFAULT NULL            COMMENT '点击跳转链接（可选）',
  `sort_order`    INT              NOT NULL DEFAULT 0      COMMENT '排序权重，越大越靠前',
  `is_visible`    TINYINT(1)       NOT NULL DEFAULT 1      COMMENT '是否展示：1-显示, 0-隐藏',
  `created_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_visible_sort` (`is_visible`, `sort_order` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Banner管理表';


-- --------------------------------------------------------------------------
-- 3. streamer_info - 主播资料表（单条记录，全局唯一）
-- --------------------------------------------------------------------------
CREATE TABLE `streamer_info` (
  `id`            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '记录ID，主键（全站仅一条记录）',
  `name`          VARCHAR(50)      NOT NULL DEFAULT ''     COMMENT '主播名称',
  `avatar_url`    VARCHAR(500)     NOT NULL DEFAULT ''     COMMENT '主播头像URL',
  `tags`          VARCHAR(500)     DEFAULT ''              COMMENT '身份标签，逗号分隔',
  `bio`           TEXT                                   COMMENT '个人简介',
  `created_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='主播资料表（单条记录）';


-- --------------------------------------------------------------------------
-- 4. awards - 获奖记录表（由主播/管理员录入）
-- --------------------------------------------------------------------------
CREATE TABLE `awards` (
  `id`            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '获奖记录ID，主键',
  `title`         VARCHAR(200)     NOT NULL                COMMENT '奖项名称',
  `description`   TEXT                                   COMMENT '奖项描述/详情',
  `image_url`     VARCHAR(500)     DEFAULT NULL            COMMENT '相关图片URL（可选）',
  `award_date`    DATE             DEFAULT NULL            COMMENT '获奖日期',
  `sort_order`    INT              NOT NULL DEFAULT 0      COMMENT '排序权重',
  `created_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_award_date` (`award_date` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='获奖记录表';


-- --------------------------------------------------------------------------
-- 5. gallery_images - 图集表（分类：二次元/三次元）
-- --------------------------------------------------------------------------
CREATE TABLE `gallery_images` (
  `id`            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '图片ID，主键',
  `category`      ENUM('二次元','三次元') NOT NULL           COMMENT '图集分类',
  `url`           VARCHAR(500)     NOT NULL                COMMENT '图片URL（上传自动压缩：质量80%，最大宽度1920px）',
  `title`         VARCHAR(100)     DEFAULT ''              COMMENT '图片标题（可选）',
  `sort_order`    INT              NOT NULL DEFAULT 0      COMMENT '排序权重',
  `created_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_category_sort` (`category`, `sort_order` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图集表（二次元/三次元分类）';


-- --------------------------------------------------------------------------
-- 6. songs - 音乐表（主播个人音乐作品，已授权使用）
-- --------------------------------------------------------------------------
CREATE TABLE `songs` (
  `id`            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '歌曲ID，主键',
  `title`         VARCHAR(200)     NOT NULL                COMMENT '歌曲名称',
  `artist`        VARCHAR(100)     DEFAULT ''              COMMENT '演唱者/创作者',
  `audio_url`     VARCHAR(500)     NOT NULL                COMMENT '音频文件URL（超192kbps自动转码压缩）',
  `cover_url`     VARCHAR(500)     DEFAULT NULL            COMMENT '歌曲封面图URL',
  `sort_order`    INT              NOT NULL DEFAULT 0      COMMENT '排序权重',
  `created_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_sort` (`sort_order` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='音乐表（主播个人音乐作品）';


-- --------------------------------------------------------------------------
-- 7. activities - 活动日历表
-- --------------------------------------------------------------------------
CREATE TABLE `activities` (
  `id`            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '活动ID，主键',
  `title`         VARCHAR(200)     NOT NULL                COMMENT '活动名称',
  `description`   TEXT                                   COMMENT '活动简介',
  `cover_url`     VARCHAR(500)     DEFAULT NULL            COMMENT '活动封面图URL',
  `start_time`    DATETIME         NOT NULL                COMMENT '活动开始时间',
  `end_time`      DATETIME         DEFAULT NULL            COMMENT '活动结束时间（可选）',
  `sort_order`    INT              NOT NULL DEFAULT 0      COMMENT '排序权重',
  `created_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_start_time` (`start_time` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动日历表';


-- --------------------------------------------------------------------------
-- 8. graph_characters - 图谱人物表（群像关系图谱，管理员/主播维护）
-- --------------------------------------------------------------------------
CREATE TABLE `graph_characters` (
  `id`            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '人物ID，主键',
  `name`          VARCHAR(50)      NOT NULL                COMMENT '人物名称',
  `avatar_url`    VARCHAR(500)     DEFAULT NULL            COMMENT '人物头像URL',
  `bio`           TEXT                                   COMMENT '人物简介',
  `is_center`     TINYINT(1)       NOT NULL DEFAULT 0      COMMENT '是否为中心主播节点：1-是, 0-否',
  `sort_order`    INT              NOT NULL DEFAULT 0      COMMENT '排序权重',
  `created_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_center` (`is_center`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图谱人物表（群像关系图谱）';


-- --------------------------------------------------------------------------
-- 9. sensitive_words - 敏感词库表（用于昵称/消息过滤）
-- --------------------------------------------------------------------------
CREATE TABLE `sensitive_words` (
  `id`            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '敏感词ID，主键',
  `word`          VARCHAR(100)     NOT NULL                COMMENT '敏感词内容',
  `created_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_word` (`word`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='敏感词库表（昵称/消息过滤用）';


-- --------------------------------------------------------------------------
-- 10. users - 用户表（三级角色：fan/admin/streamer）
-- --------------------------------------------------------------------------
CREATE TABLE `users` (
  `id`            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '用户ID，主键',
  `username`      VARCHAR(50)      NOT NULL                COMMENT '登录账号，唯一，永久不可修改',
  `password_hash` VARCHAR(255)     NOT NULL                COMMENT 'bcrypt加盐加密后的密码哈希',
  `nickname`      VARCHAR(30)      NOT NULL DEFAULT ''     COMMENT '展示昵称，最长10字符，需过敏感词过滤',
  `avatar_id`     BIGINT UNSIGNED  DEFAULT NULL            COMMENT '系统头像池ID，FK → avatars.id',
  `role`          ENUM('fan','admin','streamer') NOT NULL DEFAULT 'fan' COMMENT '角色：fan-粉丝, admin-管理员, streamer-主播',
  `status`        ENUM('active','banned') NOT NULL DEFAULT 'active' COMMENT '账号状态：active-正常, banned-封禁',
  `created_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `updated_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_users_avatar` FOREIGN KEY (`avatar_id`) REFERENCES `avatars` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表（三级角色区分）';


-- --------------------------------------------------------------------------
-- 11. graph_relations - 图谱关系连线表
-- --------------------------------------------------------------------------
CREATE TABLE `graph_relations` (
  `id`                BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '关系ID，主键',
  `from_character_id` BIGINT UNSIGNED  NOT NULL                COMMENT '起始人物ID，FK → graph_characters.id',
  `to_character_id`   BIGINT UNSIGNED  NOT NULL                COMMENT '目标人物ID，FK → graph_characters.id',
  `relation_label`    VARCHAR(100)     NOT NULL DEFAULT ''     COMMENT '关系标签（如"好友"、"对手"等）',
  `sort_order`        INT              NOT NULL DEFAULT 0      COMMENT '排序权重',
  `created_at`        DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_from` (`from_character_id`),
  KEY `idx_to` (`to_character_id`),
  CONSTRAINT `fk_relations_from` FOREIGN KEY (`from_character_id`) REFERENCES `graph_characters` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_relations_to` FOREIGN KEY (`to_character_id`) REFERENCES `graph_characters` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图谱关系连线表';


-- --------------------------------------------------------------------------
-- 12. messages - 聊天消息表
-- 【权限控制说明】
--   type = 'public'  → 所有登录用户可见
--   type = 'private' → 仅 sender_id（发送人本人）+ role='streamer'（主播）可见
--                       admin（管理员）无权读取任何私密消息
--   后端通过 SQL WHERE 条件 + 角色鉴权中间件强制过滤，前端无法篡改
-- --------------------------------------------------------------------------
CREATE TABLE `messages` (
  `id`            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '消息ID，主键',
  `sender_id`     BIGINT UNSIGNED  NOT NULL                COMMENT '发送人ID，FK → users.id',
  `content`       VARCHAR(500)     NOT NULL                COMMENT '消息内容，最长500字，需XSS过滤',
  `type`          ENUM('public','private') NOT NULL DEFAULT 'public' COMMENT '消息类型：public-公开, private-私密（仅发送人+主播可见）',
  `like_count`    INT UNSIGNED     NOT NULL DEFAULT 0      COMMENT '点赞总数（冗余计数，避免每次COUNT查询）',
  `created_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  `updated_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_type_created` (`type`, `created_at` DESC),
  KEY `idx_sender` (`sender_id`),
  CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天消息表（公开/私密，私密仅发送人+主播可见，admin不可见）';


-- --------------------------------------------------------------------------
-- 13. private_replies - 主播私密回复表
-- 【权限控制说明】
--   - 仅 role = 'streamer'（主播）可以创建回复
--   - 仅 target_user_id（原消息发送人）+ streamer 本人可见
--   - admin（管理员）不可见、不可创建
--   - 独立于 messages 表，不混入公开消息流
-- --------------------------------------------------------------------------
CREATE TABLE `private_replies` (
  `id`              BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '回复ID，主键',
  `message_id`      BIGINT UNSIGNED  NOT NULL                COMMENT '原私密消息ID，FK → messages.id',
  `streamer_id`     BIGINT UNSIGNED  NOT NULL                COMMENT '主播ID（回复人），FK → users.id，role必须为streamer',
  `target_user_id`  BIGINT UNSIGNED  NOT NULL                COMMENT '目标用户ID（原消息发送人），FK → users.id',
  `content`         VARCHAR(500)     NOT NULL                COMMENT '回复内容，最长500字，需XSS过滤',
  `created_at`      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '回复时间',
  `updated_at`      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_message` (`message_id`),
  KEY `idx_target_user` (`target_user_id`, `created_at` DESC),
  KEY `idx_streamer` (`streamer_id`),
  CONSTRAINT `fk_replies_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_replies_streamer` FOREIGN KEY (`streamer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_replies_target` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='主播私密回复表（仅streamer创建，仅发送人+streamer可见，admin不可见）';


-- --------------------------------------------------------------------------
-- 14. likes - 点赞记录表
-- 【幂等设计说明】
--   - MySQL 层：user_id + message_id 联合唯一约束，单用户对单消息仅能点赞一次
--   - Redis 层：key = like:{user_id}:{message_id}，TTL = 1s
--               同一请求 1s 内重复到达直接忽略返回，不做重复处理
--   - 前端层：点击后立即 disabled + 300ms 防抖 + 1s 节流
-- --------------------------------------------------------------------------
CREATE TABLE `likes` (
  `id`            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '点赞记录ID，主键',
  `user_id`       BIGINT UNSIGNED  NOT NULL                COMMENT '点赞用户ID，FK → users.id',
  `message_id`    BIGINT UNSIGNED  NOT NULL                COMMENT '被点赞消息ID，FK → messages.id',
  `created_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_message` (`user_id`, `message_id`),
  KEY `idx_message` (`message_id`),
  CONSTRAINT `fk_likes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_likes_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='点赞记录表（user_id+message_id唯一约束，Redis 1s幂等控制）';


-- --------------------------------------------------------------------------
-- 15. reports - 举报工单表
-- --------------------------------------------------------------------------
CREATE TABLE `reports` (
  `id`            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '举报工单ID，主键',
  `reporter_id`   BIGINT UNSIGNED  NOT NULL                COMMENT '举报人ID，FK → users.id',
  `message_id`    BIGINT UNSIGNED  NOT NULL                COMMENT '被举报消息ID，FK → messages.id',
  `reason`        VARCHAR(500)     DEFAULT ''              COMMENT '举报原因说明',
  `status`        ENUM('pending','resolved') NOT NULL DEFAULT 'pending' COMMENT '工单状态：pending-待处理, resolved-已办结',
  `resolved_at`   DATETIME         DEFAULT NULL            COMMENT '处理时间',
  `created_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '举报时间',
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`, `created_at` DESC),
  KEY `idx_reporter` (`reporter_id`),
  KEY `idx_message` (`message_id`),
  CONSTRAINT `fk_reports_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reports_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='举报工单表';


-- --------------------------------------------------------------------------
-- 16. check_ins - 打卡记录表
-- 【唯一约束】user_id + check_date 联合唯一，每日仅可打卡一次
-- --------------------------------------------------------------------------
CREATE TABLE `check_ins` (
  `id`            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '打卡记录ID，主键',
  `user_id`       BIGINT UNSIGNED  NOT NULL                COMMENT '打卡用户ID，FK → users.id',
  `check_date`    DATE             NOT NULL                COMMENT '打卡日期（YYYY-MM-DD）',
  `created_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '打卡精确时间（用于悬浮展示）',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_date` (`user_id`, `check_date`),
  KEY `idx_user_created` (`user_id`, `created_at` DESC),
  CONSTRAINT `fk_checkins_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='打卡记录表（user_id+date唯一约束，每日一次）';


-- --------------------------------------------------------------------------
-- 17. admin_logs - 管理员/主播操作日志表
-- --------------------------------------------------------------------------
CREATE TABLE `admin_logs` (
  `id`            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '日志ID，主键',
  `admin_id`      BIGINT UNSIGNED  NOT NULL                COMMENT '操作人ID（admin或streamer），FK → users.id',
  `action`        VARCHAR(100)     NOT NULL                COMMENT '操作类型（如 delete_message, ban_user, create_banner 等）',
  `target_type`   VARCHAR(50)      DEFAULT ''              COMMENT '操作对象类型（如 message, user, banner 等）',
  `target_id`     BIGINT UNSIGNED  DEFAULT NULL            COMMENT '操作对象ID',
  `detail`        TEXT                                   COMMENT '操作详情/备注',
  `created_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`id`),
  KEY `idx_admin_created` (`admin_id`, `created_at` DESC),
  KEY `idx_action` (`action`),
  KEY `idx_target` (`target_type`, `target_id`),
  CONSTRAINT `fk_adminlogs_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员/主播操作日志表';


-- ============================================================================
-- 关键查询场景索引说明
-- ============================================================================
--
-- 1. 聊天室轮询（按时间倒序获取公开消息，3秒一次）：
--    SELECT * FROM messages WHERE type='public' ORDER BY created_at DESC LIMIT 20;
--    → 命中 idx_type_created
--
-- 2. 粉丝查看自己的私密消息：
--    SELECT * FROM messages WHERE type='private' AND sender_id = ? ORDER BY created_at DESC;
--    → 命中 idx_sender + type 过滤
--
-- 3. 主播查看所有私密消息：
--    SELECT * FROM messages WHERE type='private' ORDER BY created_at DESC LIMIT 20;
--    → 命中 idx_type_created
--
-- 4. 主播查看对某私密消息的回复：
--    SELECT * FROM private_replies WHERE message_id = ?;
--    → 命中 idx_message
--
-- 5. 粉丝查看主播对自己的私密回复：
--    SELECT * FROM private_replies WHERE target_user_id = ? ORDER BY created_at DESC;
--    → 命中 idx_target_user
--
-- 6. 用户月度打卡日历：
--    SELECT * FROM check_ins WHERE user_id = ? AND check_date BETWEEN ? AND ?;
--    → 命中 uk_user_date（覆盖索引）
--
-- 7. 举报工单列表（待处理优先）：
--    SELECT * FROM reports WHERE status = 'pending' ORDER BY created_at DESC;
--    → 命中 idx_status
--
-- 8. 点赞幂等校验：
--    SELECT * FROM likes WHERE user_id = ? AND message_id = ?;
--    → 命中 uk_user_message（唯一索引，O(1) 查找）
--
-- 9. 图谱数据加载（数据量 ≤ 11 人物，全表即可）：
--    SELECT * FROM graph_characters;
--    SELECT * FROM graph_relations;
--
-- 10. 图集分页（按分类 + 排序）：
--     SELECT * FROM gallery_images WHERE category = ? ORDER BY sort_order DESC LIMIT 20 OFFSET ?;
--     → 命中 idx_category_sort
--
-- 11. 敏感词匹配（昵称校验）：
--     SELECT * FROM sensitive_words WHERE word = ?;
--     → 命中 uk_word
--
-- 12. 用户列表管理（后台）：
--     SELECT id, username, nickname, role, status, created_at FROM users ORDER BY created_at DESC LIMIT 20;
--     → 命中 PRIMARY KEY + 排序
-- ============================================================================

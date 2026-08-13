/**
 * 全局常量定义
 */

export const ERROR_CODE = {
  SUCCESS: 0,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
}

export const EXPIRY_TIME = {
  JWT_EXPIRES: '7d',
  CAPTCHA_EXPIRES: 300,
  MESSAGE_COOLDOWN: 20,
  LIKE_IDEMPOTENT: 1,
  LOGIN_COOLDOWN: 60,
}

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 20,
}

export const REGEX = {
  USERNAME: /^[a-zA-Z][a-zA-Z0-9_]{2,49}$/,
  PASSWORD: /^.{6,20}$/,
  ID: /^\d+$/,
}

export const REDIS_KEYS = {
  captcha: (id: string) => `${id}:svg_captcha`,
  jwtBlacklist: (jti: string) => `jwt_blacklist:${jti}`,
  messageRateLimit: (userId: string | bigint) => `rate_limit:msg:${userId}`,
  likeAdd: (userId: string | bigint, messageId: string | bigint) => `like:add:${userId}:${messageId}`,
  likeRemove: (userId: string | bigint, messageId: string | bigint) => `like:remove:${userId}:${messageId}`,
  loginRateLimit: (username: string) => `rate_limit:login:${username}`,
}

export const UPLOAD = {
  ALLOWED_CATEGORIES: ['images', 'banners', 'avatars', 'gallery', 'awards', 'activities', 'graph', 'songs'] as const,
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,
  MAX_AUDIO_SIZE: 50 * 1024 * 1024,
}

export const TIMEZONE = 'Asia/Shanghai'

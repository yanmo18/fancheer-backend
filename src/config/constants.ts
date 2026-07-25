/**
 * 全局常量定义
 * 
 * 作用：集中管理项目中所有固定不变的值
 *       避免魔法数字散落各处，修改时只需改一处
 * 
 * 使用方式：
 *   import { ERROR_CODE, EXPIRY_TIME, REGEX } from '../config/constants'
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
}

export const REGEX = {
  USERNAME: /^[a-zA-Z][a-zA-Z0-9_]{2,49}$/,
  PASSWORD: /^.{6,20}$/,
}
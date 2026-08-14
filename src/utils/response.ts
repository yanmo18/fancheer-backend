/**
 * 统一响应工具函数
 */

export const success = <T>(data: T | null = null, msg = 'success', code = 0) => {
  return { code, msg, data }
}

export const fail = (msg = '操作失败', code = 400, data: null = null) => {
  return { code, msg, data }
}

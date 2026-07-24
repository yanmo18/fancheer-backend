/**
 * 统一响应工具函数
 * 
 * 作用：全站接口强制统一返回格式 {code, msg, data}
 * 
 * 使用方式：
 *   import { success, fail } from '../utils/response'
 *   res.json(success(data, '操作成功'))
 *   res.json(fail('参数错误', 400))
 */

export const success = <T>(data?: T, msg = '操作成功', code = 0) => {
  return { code, msg, data }
}

export const fail = (msg = '操作失败', code = 400, data?: any) => {
  return { code, msg, data }
}
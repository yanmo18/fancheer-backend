/**
 * 参数校验工具函数
 * 
 * 作用：统一管理正则表达式和错误提示，避免重复代码
 *       所有校验函数返回 null 表示校验通过，返回字符串表示错误信息
 * 
 * 使用方式：
 *   import { validateUsername, validatePassword } from '../utils/validate'
 *   const error = validateUsername(username)
 *   if (error) return res.json(fail(error, 400))
 */

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{2,49}$/
const PASSWORD_REGEX = /^.{6,20}$/

export const validateUsername = (username: string): string | null => {
  if (!username) return '用户名不能为空'
  if (!USERNAME_REGEX.test(username)) return '用户名格式错误（字母开头，3-50字符，仅含字母数字下划线）'
  return null
}

export const validatePassword = (password: string): string | null => {
  if (!password) return '密码不能为空'
  if (!PASSWORD_REGEX.test(password)) return '密码格式错误（6-20字符）'
  return null
}

export const validateNickname = (nickname: string): string | null => {
  if (!nickname) return '昵称不能为空'
  if (nickname.length > 10) return '昵称长度不能超过10个字符'
  return null
}

export const validateMessage = (content: string): string | null => {
  if (!content) return '消息内容不能为空'
  if (content.length > 500) return '消息长度不能超过500个字符'
  return null
}
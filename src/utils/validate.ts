/**
 * 参数校验工具函数
 */

import { REGEX } from '../config/constants'

export const validateUsername = (username: string): string | null => {
  if (!username) return '用户名不能为空'
  if (!REGEX.USERNAME.test(username)) return '用户名格式错误（字母开头，3-50字符，仅含字母数字下划线）'
  return null
}

export const validatePassword = (password: string): string | null => {
  if (!password) return '密码不能为空'
  if (!REGEX.PASSWORD.test(password)) return '密码格式错误（6-20字符）'
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

export const validateYearMonth = (year: number, month: number): string | null => {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return '年份参数无效'
  if (!Number.isInteger(month) || month < 1 || month > 12) return '月份参数无效'
  return null
}

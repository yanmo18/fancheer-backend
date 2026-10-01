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

/** 登录后改密：当前密码只要求非空，新密码走注册同一套格式 */
export const validatePasswordChange = (
  currentPassword: string,
  newPassword: string,
  confirmPassword?: string,
): string | null => {
  if (!currentPassword) return '请输入当前密码'
  const newError = validatePassword(newPassword)
  if (newError) return newError.replace('密码', '新密码')
  if (confirmPassword !== undefined && confirmPassword !== newPassword) {
    return '两次输入的新密码不一致'
  }
  if (currentPassword === newPassword) return '新密码不能与当前密码相同'
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

export const validateReportReason = (reason: string): string | null => {
  const text = reason.trim()
  if (!text) return '请填写举报原因'
  if (text.length > 200) return '举报原因不能超过200个字符'
  return null
}

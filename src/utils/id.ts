import AppError from './appError'
import { REGEX } from '../config/constants'

const normalizeIdInput = (id: string | string[] | number | undefined | null): string | number | undefined | null => {
  if (Array.isArray(id)) return id[0]
  return id
}

export const parseId = (id: string | string[] | number | undefined | null, label = 'ID'): bigint => {
  const raw = normalizeIdInput(id)
  if (raw === undefined || raw === null || raw === '') {
    throw new AppError(`${label}不能为空`, 400)
  }
  const str = String(raw)
  if (!REGEX.ID.test(str)) {
    throw new AppError(`${label}格式无效`, 400)
  }
  return BigInt(str)
}

export const parseOptionalId = (id: string | string[] | number | undefined | null): bigint | undefined => {
  const raw = normalizeIdInput(id)
  if (raw === undefined || raw === null || raw === '') return undefined
  return parseId(raw, 'ID')
}

export const userIdFromRequest = (userId: string | undefined): bigint => {
  if (!userId) throw new AppError('未登录', 401)
  return BigInt(userId)
}

import { describe, expect, it } from 'vitest'
import { parsePagination } from '../src/utils/pagination'
import { fail, success } from '../src/utils/response'

describe('parsePagination', () => {
  it('falls back to defaults', () => {
    expect(parsePagination(undefined, undefined)).toEqual({ page: 1, pageSize: 20 })
  })

  it('caps pageSize at 20', () => {
    expect(parsePagination('2', '99')).toEqual({ page: 2, pageSize: 20 })
  })

  it('rejects non-positive page', () => {
    expect(parsePagination('0', '10')).toEqual({ page: 1, pageSize: 10 })
  })
})

describe('response helpers', () => {
  it('success wraps data', () => {
    expect(success({ id: '1' }, 'ok')).toEqual({
      code: 0,
      msg: 'ok',
      data: { id: '1' },
    })
  })

  it('fail always sets data null', () => {
    expect(fail('未登录', 401)).toEqual({
      code: 401,
      msg: '未登录',
      data: null,
    })
  })
})

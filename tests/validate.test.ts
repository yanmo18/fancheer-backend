import { describe, expect, it } from 'vitest'
import {
  validateMessage,
  validateNickname,
  validatePassword,
  validatePasswordChange,
  validateUsername,
  validateYearMonth,
  validateReportReason,
} from '../src/utils/validate'

describe('validateUsername', () => {
  it('accepts valid username', () => {
    expect(validateUsername('fan001')).toBeNull()
  })

  it('rejects empty username', () => {
    expect(validateUsername('')).toBeTruthy()
  })

  it('rejects invalid pattern', () => {
    expect(validateUsername('1bad')).toBeTruthy()
  })
})

describe('validatePassword', () => {
  it('accepts 6-20 chars', () => {
    expect(validatePassword('123456')).toBeNull()
  })

  it('rejects too short', () => {
    expect(validatePassword('12345')).toBeTruthy()
  })
})

describe('validatePasswordChange', () => {
  it('accepts a valid change', () => {
    expect(validatePasswordChange('123456', 'abcdef', 'abcdef')).toBeNull()
  })

  it('rejects empty current password', () => {
    expect(validatePasswordChange('', 'abcdef', 'abcdef')).toBeTruthy()
  })

  it('rejects mismatched confirmation', () => {
    expect(validatePasswordChange('123456', 'abcdef', 'abcdeg')).toBe('两次输入的新密码不一致')
  })

  it('rejects same as current password', () => {
    expect(validatePasswordChange('123456', '123456', '123456')).toBe('新密码不能与当前密码相同')
  })
})

describe('validateMessage', () => {
  it('rejects empty content', () => {
    expect(validateMessage('')).toBeTruthy()
  })

  it('rejects over 500 chars', () => {
    expect(validateMessage('x'.repeat(501))).toBeTruthy()
  })
})

describe('validateNickname', () => {
  it('rejects over 10 chars', () => {
    expect(validateNickname('12345678901')).toBeTruthy()
  })
})

describe('validateYearMonth', () => {
  it('accepts valid month', () => {
    expect(validateYearMonth(2026, 8)).toBeNull()
  })

  it('rejects invalid month', () => {
    expect(validateYearMonth(2026, 13)).toBeTruthy()
  })
})

describe('validateReportReason', () => {
  it('accepts a normal reason', () => {
    expect(validateReportReason('  人身攻击  ')).toBeNull()
  })

  it('rejects empty reason', () => {
    expect(validateReportReason('   ')).toBe('请填写举报原因')
  })

  it('rejects over 200 chars', () => {
    expect(validateReportReason('x'.repeat(201))).toBe('举报原因不能超过200个字符')
  })
})

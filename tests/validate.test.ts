import { describe, expect, it } from 'vitest'
import {
  validateMessage,
  validateNickname,
  validatePassword,
  validateUsername,
  validateYearMonth,
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

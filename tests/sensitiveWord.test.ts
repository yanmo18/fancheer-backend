import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    sensitive_words: {
      findMany: vi.fn().mockResolvedValue([{ word: '违禁词' }]),
    },
  },
}))

import { checkSensitiveWord, getSensitiveWordError, loadSensitiveWords } from '../src/utils/sensitiveWord'

describe('sensitiveWord', () => {
  beforeEach(async () => {
    await loadSensitiveWords()
  })

  it('detects sensitive word', () => {
    expect(checkSensitiveWord('这里有违禁词内容').hasSensitive).toBe(true)
  })

  it('passes clean text', () => {
    expect(checkSensitiveWord('正常内容').hasSensitive).toBe(false)
  })

  it('getSensitiveWordError returns message for sensitive text', () => {
    expect(getSensitiveWordError('违禁词')).toMatch(/敏感词/)
  })

  it('getSensitiveWordError returns null for clean text', () => {
    expect(getSensitiveWordError('你好', undefined, '')).toBeNull()
  })
})

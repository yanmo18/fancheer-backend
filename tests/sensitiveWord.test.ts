import { describe, expect, it } from 'vitest'
import {
  checkSensitiveWord,
  getSensitiveWordError,
  replaceSensitiveWordsCache,
} from '../src/utils/sensitiveWord'

describe('sensitiveWord matching', () => {
  it('detects chinese phrase', () => {
    replaceSensitiveWordsCache(['违禁词', '广告'])
    expect(checkSensitiveWord('这里有违禁词内容').hasSensitive).toBe(true)
  })

  it('passes clean text', () => {
    replaceSensitiveWordsCache(['违禁词'])
    expect(checkSensitiveWord('正常内容').hasSensitive).toBe(false)
  })

  it('does not match english substring inside a longer word', () => {
    replaceSensitiveWordsCache(['ass'])
    expect(checkSensitiveWord('classic classroom').hasSensitive).toBe(false)
    expect(checkSensitiveWord('pass').hasSensitive).toBe(false)
    expect(checkSensitiveWord('ass').hasSensitive).toBe(true)
    expect(checkSensitiveWord('an ass.').hasSensitive).toBe(true)
  })

  it('ignores one-character words in the dictionary', () => {
    replaceSensitiveWordsCache(['死', '暴力'])
    expect(checkSensitiveWord('死机了').hasSensitive).toBe(false)
    expect(checkSensitiveWord('不要暴力').hasSensitive).toBe(true)
  })

  it('does not match chinese across punctuation', () => {
    replaceSensitiveWordsCache(['色情'])
    expect(checkSensitiveWord('工作出色、情商很高').hasSensitive).toBe(false)
    expect(checkSensitiveWord('今天工作出色').hasSensitive).toBe(false)
    expect(checkSensitiveWord('这是色情内容').hasSensitive).toBe(true)
  })

  it('still matches chinese words split only by spaces', () => {
    replaceSensitiveWordsCache(['广告'])
    expect(checkSensitiveWord('不要广 告').hasSensitive).toBe(true)
    expect(checkSensitiveWord('正常留言').hasSensitive).toBe(false)
  })

  it('getSensitiveWordError returns message for sensitive text', () => {
    replaceSensitiveWordsCache(['违禁词'])
    expect(getSensitiveWordError('违禁词')).toMatch(/敏感词/)
  })

  it('getSensitiveWordError returns null for clean text', () => {
    replaceSensitiveWordsCache(['违禁词'])
    expect(getSensitiveWordError('你好', undefined, '')).toBeNull()
  })
})

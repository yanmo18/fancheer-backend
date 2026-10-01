import { prisma } from '../lib/prisma'

const MIN_WORD_LENGTH = 2

type CompiledWord = {
  raw: string
  ascii: boolean
  regex?: RegExp
}

let compiledWords: CompiledWord[] = []

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isAsciiWord(word: string) {
  return /^[\x20-\x7E]+$/.test(word) && /[A-Za-z0-9]/.test(word)
}

function stripIgnorable(text: string) {
  return text.replace(/[\u200b-\u200d\ufeff]/g, '')
}

function compactForCjk(text: string) {
  // 只去掉空白，防止「广 告」拆字绕过；不去掉顿号等标点，避免「出色、情商」误伤
  return text.replace(/\s+/g, '')
}

export function compileSensitiveWords(words: string[]): CompiledWord[] {
  const unique = [...new Set(words.map((word) => word.trim()).filter((word) => word.length >= MIN_WORD_LENGTH))]
  unique.sort((a, b) => b.length - a.length)

  return unique.map((raw) => {
    if (isAsciiWord(raw)) {
      const pattern = `(?<![A-Za-z0-9_])${escapeRegExp(raw)}(?![A-Za-z0-9_])`
      return { raw, ascii: true, regex: new RegExp(pattern, 'i') }
    }
    return { raw, ascii: false }
  })
}

/** 测试或热更新词库时替换内存缓存 */
export function replaceSensitiveWordsCache(words: string[]) {
  compiledWords = compileSensitiveWords(words)
}

export const loadSensitiveWords = async () => {
  const words = await prisma.sensitive_words.findMany({
    select: { word: true },
  })
  replaceSensitiveWordsCache(words.map((item) => item.word))
}

export const checkSensitiveWord = (text: string): { hasSensitive: boolean; matchedWord?: string } => {
  const source = stripIgnorable(text)
  if (!source.trim()) return { hasSensitive: false }
  const compact = compactForCjk(source)

  for (const word of compiledWords) {
    if (word.ascii && word.regex) {
      if (word.regex.test(source)) {
        return { hasSensitive: true, matchedWord: word.raw }
      }
      continue
    }
    if (source.includes(word.raw) || compact.includes(word.raw)) {
      return { hasSensitive: true, matchedWord: word.raw }
    }
  }

  return { hasSensitive: false }
}

/** 校验多段文本，返回 API 错误文案；无敏感词时返回 null */
export function getSensitiveWordError(...texts: Array<string | undefined | null>): string | null {
  for (const raw of texts) {
    const text = raw?.trim()
    if (!text) continue
    const { hasSensitive } = checkSensitiveWord(text)
    if (hasSensitive) return '内容包含敏感词，请修改后重试'
  }
  return null
}

export const SENSITIVE_WORD_MIN_LENGTH = MIN_WORD_LENGTH

import { prisma } from '../lib/prisma'

let sensitiveWords: string[] = []

export const loadSensitiveWords = async () => {
  const words = await prisma.sensitive_words.findMany({
    select: { word: true }
  })
  sensitiveWords = words.map(w => w.word)
}

export const checkSensitiveWord = (text: string): { hasSensitive: boolean; matchedWord?: string } => {
  for (const word of sensitiveWords) {
    if (text.includes(word)) {
      return { hasSensitive: true, matchedWord: word }
    }
  }
  return { hasSensitive: false }
}

/** 校验多段文本，返回 API 错误文案；无敏感词时返回 null */
export function getSensitiveWordError(...texts: Array<string | undefined | null>): string | null {
  for (const raw of texts) {
    const text = raw?.trim()
    if (!text) continue
    const { hasSensitive, matchedWord } = checkSensitiveWord(text)
    if (hasSensitive) return `内容包含敏感词: ${matchedWord}`
  }
  return null
}
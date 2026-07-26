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
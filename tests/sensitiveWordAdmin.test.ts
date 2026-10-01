import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/utils/sensitiveWord', () => ({
  loadSensitiveWords: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    sensitive_words: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    admin_logs: {
      create: vi.fn(),
    },
  },
}))

import { prisma } from '../src/lib/prisma'
import { loadSensitiveWords } from '../src/utils/sensitiveWord'
import { createSensitiveWord, deleteSensitiveWord } from '../src/services/admin.service'

describe('sensitive word admin', () => {
  const adminId = 1n

  beforeEach(() => {
    vi.mocked(prisma.sensitive_words.findUnique).mockReset()
    vi.mocked(prisma.sensitive_words.create).mockReset()
    vi.mocked(prisma.sensitive_words.delete).mockReset()
    vi.mocked(prisma.admin_logs.create).mockReset()
    vi.mocked(loadSensitiveWords).mockClear()
    vi.mocked(prisma.admin_logs.create).mockResolvedValue({} as never)
  })

  it('creates a trimmed word and reloads the filter', async () => {
    vi.mocked(prisma.sensitive_words.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.sensitive_words.create).mockResolvedValue({ id: 7n } as never)

    const result = await createSensitiveWord(' 广告 ', adminId)

    expect(result.id).toBe(7n)
    expect(prisma.sensitive_words.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { word: '广告' } }),
    )
    expect(loadSensitiveWords).toHaveBeenCalled()
  })

  it('rejects a single character', async () => {
    await expect(createSensitiveWord('广', adminId)).rejects.toMatchObject({
      message: '敏感词至少 2 个字符，避免单字误伤',
      code: 400,
    })
  })

  it('rejects a duplicate word', async () => {
    vi.mocked(prisma.sensitive_words.findUnique).mockResolvedValue({ id: 1n, word: '广告' } as never)
    await expect(createSensitiveWord('广告', adminId)).rejects.toMatchObject({
      message: '敏感词已存在',
      code: 409,
    })
  })

  it('deletes an existing word', async () => {
    vi.mocked(prisma.sensitive_words.findUnique).mockResolvedValue({ id: 7n, word: '广告' } as never)
    vi.mocked(prisma.sensitive_words.delete).mockResolvedValue({} as never)

    await deleteSensitiveWord(7n, adminId)

    expect(prisma.sensitive_words.delete).toHaveBeenCalledWith({ where: { id: 7n } })
    expect(loadSensitiveWords).toHaveBeenCalled()
  })

  it('rejects deleting a missing word', async () => {
    vi.mocked(prisma.sensitive_words.findUnique).mockResolvedValue(null)
    await expect(deleteSensitiveWord(7n, adminId)).rejects.toMatchObject({
      message: '敏感词不存在',
      code: 404,
    })
  })
})

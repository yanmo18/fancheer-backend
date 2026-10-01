import { beforeEach, describe, expect, it, vi } from 'vitest'

const { redisStore, redisMock } = vi.hoisted(() => {
  const store = new Map<string, string>()
  return {
    redisStore: store,
    redisMock: {
      get: vi.fn(async (key: string) => store.get(key) ?? null),
      set: vi.fn(async (key: string, value: string) => {
        store.set(key, value)
        return 'OK'
      }),
    },
  }
})

vi.mock('../src/config/redis', () => ({
  default: redisMock,
}))

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    messages: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    likes: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}))

import { prisma } from '../src/lib/prisma'
import { likeMessage, sendMessage, unlikeMessage } from '../src/services/chat.service'

describe('likeMessage / unlikeMessage / sendMessage', () => {
  const userId = 2n
  const messageId = 9n

  beforeEach(() => {
    redisStore.clear()
    vi.mocked(redisMock.get).mockClear()
    vi.mocked(redisMock.set).mockClear()
    vi.mocked(prisma.messages.findUnique).mockReset()
    vi.mocked(prisma.messages.create).mockReset()
    vi.mocked(prisma.messages.update).mockReset()
    vi.mocked(prisma.likes.findUnique).mockReset()
    vi.mocked(prisma.likes.create).mockReset()
    vi.mocked(prisma.likes.delete).mockReset()
    vi.mocked(prisma.likes.count).mockReset()
    vi.mocked(prisma.$transaction).mockClear()
    vi.mocked(prisma.likes.create).mockResolvedValue({} as never)
    vi.mocked(prisma.likes.delete).mockResolvedValue({} as never)
    vi.mocked(prisma.messages.update).mockResolvedValue({} as never)
  })

  it('likes a public message', async () => {
    vi.mocked(prisma.messages.findUnique).mockResolvedValue({
      id: messageId,
      type: 'public',
    } as never)
    vi.mocked(prisma.likes.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.likes.count).mockResolvedValue(4)

    const result = await likeMessage(userId, messageId)

    expect(result.likeCount).toBe(4)
    expect(prisma.$transaction).toHaveBeenCalled()
    expect(redisMock.set).toHaveBeenCalled()
  })

  it('rejects like on missing message', async () => {
    vi.mocked(prisma.messages.findUnique).mockResolvedValue(null)

    await expect(likeMessage(userId, messageId)).rejects.toMatchObject({
      message: '消息不存在',
      code: 404,
    })
  })

  it('rejects like on private message', async () => {
    vi.mocked(prisma.messages.findUnique).mockResolvedValue({
      id: messageId,
      type: 'private',
    } as never)

    await expect(likeMessage(userId, messageId)).rejects.toMatchObject({
      code: 400,
    })
  })

  it('rejects duplicate like', async () => {
    vi.mocked(prisma.messages.findUnique).mockResolvedValue({
      id: messageId,
      type: 'public',
    } as never)
    vi.mocked(prisma.likes.findUnique).mockResolvedValue({ id: 1n } as never)

    await expect(likeMessage(userId, messageId)).rejects.toMatchObject({
      message: '已点赞过',
      code: 409,
    })
  })

  it('returns cached like count when idempotent key exists', async () => {
    redisStore.set(`like:add:${userId}:${messageId}`, '1')
    vi.mocked(prisma.likes.count).mockResolvedValue(7)

    const result = await likeMessage(userId, messageId)

    expect(result.likeCount).toBe(7)
    expect(prisma.messages.findUnique).not.toHaveBeenCalled()
  })

  it('unlikes a public message', async () => {
    vi.mocked(prisma.messages.findUnique).mockResolvedValue({
      id: messageId,
      type: 'public',
    } as never)
    vi.mocked(prisma.likes.findUnique).mockResolvedValue({ id: 1n } as never)
    vi.mocked(prisma.likes.count).mockResolvedValue(2)

    const result = await unlikeMessage(userId, messageId)

    expect(result.likeCount).toBe(2)
    expect(prisma.likes.delete).toHaveBeenCalled()
  })

  it('rate-limits sending messages', async () => {
    redisStore.set(`rate_limit:msg:${userId}`, '1')

    await expect(sendMessage(userId, 'hello')).rejects.toMatchObject({
      code: 429,
    })
    expect(prisma.messages.create).not.toHaveBeenCalled()
  })

  it('creates a public message when not rate-limited', async () => {
    const now = new Date()
    vi.mocked(prisma.messages.create).mockResolvedValue({
      id: 11n,
      content: 'hello',
      type: 'public',
      created_at: now,
    } as never)

    const result = await sendMessage(userId, 'hello')

    expect(result.content).toBe('hello')
    expect(result.likeCount).toBe(0)
    expect(redisMock.set).toHaveBeenCalled()
  })
})

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
    },
    private_replies: {
      create: vi.fn(),
    },
    admin_logs: {
      create: vi.fn(),
    },
  },
}))

import { prisma } from '../src/lib/prisma'
import { privateReply, streamerReply } from '../src/services/chat.service'

describe('streamerReply / privateReply', () => {
  const streamerId = 1n
  const messageId = 20n
  const senderId = 9n

  beforeEach(() => {
    redisStore.clear()
    vi.mocked(prisma.messages.findUnique).mockReset()
    vi.mocked(prisma.private_replies.create).mockReset()
    vi.mocked(prisma.admin_logs.create).mockReset()
    vi.mocked(prisma.admin_logs.create).mockResolvedValue({} as never)
  })

  it('replies to a public message', async () => {
    vi.mocked(prisma.messages.findUnique).mockResolvedValue({
      id: messageId,
      type: 'public',
      sender_id: senderId,
    } as never)
    vi.mocked(prisma.private_replies.create).mockResolvedValue({
      id: 3n,
      message_id: messageId,
      streamer_id: streamerId,
      target_user_id: senderId,
      content: '谢谢',
      is_public: true,
      created_at: new Date(),
    } as never)

    const result = await streamerReply(streamerId, messageId, '谢谢')

    expect(result.isPublic).toBe(true)
    expect(result.targetUserId).toBe(senderId)
    expect(prisma.admin_logs.create).toHaveBeenCalled()
  })

  it('rejects a public reply on a private message', async () => {
    vi.mocked(prisma.messages.findUnique).mockResolvedValue({
      id: messageId,
      type: 'private',
      sender_id: senderId,
    } as never)

    await expect(streamerReply(streamerId, messageId, '谢谢')).rejects.toMatchObject({
      message: '仅可回复公开留言',
      code: 400,
    })
  })

  it('replies privately to a private message', async () => {
    vi.mocked(prisma.messages.findUnique).mockResolvedValue({
      id: messageId,
      type: 'private',
      sender_id: senderId,
    } as never)
    vi.mocked(prisma.private_replies.create).mockResolvedValue({
      id: 4n,
      message_id: messageId,
      streamer_id: streamerId,
      target_user_id: senderId,
      content: '已收到',
      is_public: false,
      created_at: new Date(),
    } as never)

    const result = await privateReply(streamerId, messageId, '已收到', false)

    expect(result.isPublic).toBe(false)
    expect(prisma.admin_logs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'create_private_reply' }),
      }),
    )
  })

  it('rate-limits replies', async () => {
    redisStore.set(`rate_limit:msg:${streamerId}`, '1')
    await expect(streamerReply(streamerId, messageId, '谢谢')).rejects.toMatchObject({
      code: 429,
    })
    expect(prisma.messages.findUnique).not.toHaveBeenCalled()
  })
})

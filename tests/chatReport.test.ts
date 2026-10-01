import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/config/redis', () => ({
  default: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  },
}))

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    messages: {
      findUnique: vi.fn(),
    },
    reports: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { prisma } from '../src/lib/prisma'
import { reportMessage } from '../src/services/chat.service'

describe('reportMessage', () => {
  const reporterId = 2n
  const messageId = 15n

  beforeEach(() => {
    vi.mocked(prisma.messages.findUnique).mockReset()
    vi.mocked(prisma.reports.findFirst).mockReset()
    vi.mocked(prisma.reports.create).mockReset()
  })

  it('creates a pending report', async () => {
    vi.mocked(prisma.messages.findUnique).mockResolvedValue({
      id: messageId,
      sender_id: 9n,
    } as never)
    vi.mocked(prisma.reports.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.reports.create).mockResolvedValue({ id: 99n } as never)

    const result = await reportMessage(reporterId, messageId, '辱骂')

    expect(result.reportId).toBe(99n)
    expect(prisma.reports.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reporter_id: reporterId,
          message_id: messageId,
          reason: '辱骂',
          status: 'pending',
        }),
      }),
    )
  })

  it('rejects reporting a missing message', async () => {
    vi.mocked(prisma.messages.findUnique).mockResolvedValue(null)

    await expect(reportMessage(reporterId, messageId, 'spam')).rejects.toMatchObject({
      message: '消息不存在',
      code: 404,
    })
  })

  it('rejects reporting own message', async () => {
    vi.mocked(prisma.messages.findUnique).mockResolvedValue({
      id: messageId,
      sender_id: reporterId,
    } as never)

    await expect(reportMessage(reporterId, messageId, 'spam')).rejects.toMatchObject({
      message: '不能举报自己的消息',
      code: 400,
    })
  })

  it('rejects a duplicate report', async () => {
    vi.mocked(prisma.messages.findUnique).mockResolvedValue({
      id: messageId,
      sender_id: 9n,
    } as never)
    vi.mocked(prisma.reports.findFirst).mockResolvedValue({ id: 1n } as never)

    await expect(reportMessage(reporterId, messageId, 'spam')).rejects.toMatchObject({
      message: '您已经举报过这条消息了',
      code: 409,
    })
  })
})

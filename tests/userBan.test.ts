import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    users: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    admin_logs: {
      create: vi.fn(),
    },
  },
}))

import { prisma } from '../src/lib/prisma'
import { banUser, unbanUser } from '../src/services/admin.service'

describe('banUser / unbanUser', () => {
  const fanId = 12n
  const adminId = 1n

  beforeEach(() => {
    vi.mocked(prisma.users.findUnique).mockReset()
    vi.mocked(prisma.users.update).mockReset()
    vi.mocked(prisma.admin_logs.create).mockReset()
    vi.mocked(prisma.users.update).mockResolvedValue({} as never)
    vi.mocked(prisma.admin_logs.create).mockResolvedValue({} as never)
  })

  it('bans a fan with a remark', async () => {
    vi.mocked(prisma.users.findUnique).mockResolvedValue({
      id: fanId,
      username: 'fan001',
      role: 'fan',
    } as never)

    await banUser(fanId, adminId, ' 恶意刷屏 ')

    expect(prisma.users.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: fanId },
        data: expect.objectContaining({
          status: 'banned',
          ban_remark: '恶意刷屏',
        }),
      }),
    )
    expect(prisma.admin_logs.create).toHaveBeenCalled()
  })

  it('rejects banning a streamer', async () => {
    vi.mocked(prisma.users.findUnique).mockResolvedValue({
      id: 2n,
      username: 'host',
      role: 'streamer',
    } as never)

    await expect(banUser(2n, adminId, 'nope')).rejects.toMatchObject({
      message: '不能封禁协管员或站主',
      code: 400,
    })
    expect(prisma.users.update).not.toHaveBeenCalled()
  })

  it('requires a ban remark', async () => {
    vi.mocked(prisma.users.findUnique).mockResolvedValue({
      id: fanId,
      username: 'fan001',
      role: 'fan',
    } as never)

    await expect(banUser(fanId, adminId, '  ')).rejects.toMatchObject({
      message: '请填写封禁备注',
      code: 400,
    })
  })

  it('unbans a user and clears the remark', async () => {
    vi.mocked(prisma.users.findUnique).mockResolvedValue({
      id: fanId,
      username: 'fan001',
      role: 'fan',
    } as never)

    await unbanUser(fanId, adminId)

    expect(prisma.users.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'active',
          ban_remark: null,
        }),
      }),
    )
  })
})

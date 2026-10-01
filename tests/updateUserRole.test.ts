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
import { updateUserRole } from '../src/services/admin.service'

describe('updateUserRole', () => {
  const operatorId = 1n
  const fanId = 12n

  beforeEach(() => {
    vi.mocked(prisma.users.findUnique).mockReset()
    vi.mocked(prisma.users.update).mockReset()
    vi.mocked(prisma.admin_logs.create).mockReset()
    vi.mocked(prisma.admin_logs.create).mockResolvedValue({} as never)
  })

  it('promotes a fan to admin', async () => {
    vi.mocked(prisma.users.findUnique).mockResolvedValue({
      id: fanId,
      username: 'fan001',
      role: 'fan',
    } as never)
    vi.mocked(prisma.users.update).mockResolvedValue({
      id: fanId,
      username: 'fan001',
      role: 'admin',
    } as never)

    const result = await updateUserRole(fanId, 'admin', operatorId)

    expect(result.role).toBe('admin')
    expect(prisma.admin_logs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'promote_admin' }),
      }),
    )
  })

  it('skips update when role is unchanged', async () => {
    vi.mocked(prisma.users.findUnique).mockResolvedValue({
      id: fanId,
      username: 'fan001',
      role: 'admin',
    } as never)

    const result = await updateUserRole(fanId, 'admin', operatorId)

    expect(result.role).toBe('admin')
    expect(prisma.users.update).not.toHaveBeenCalled()
  })

  it('rejects changing the streamer', async () => {
    vi.mocked(prisma.users.findUnique).mockResolvedValue({
      id: 2n,
      username: 'host',
      role: 'streamer',
    } as never)

    await expect(updateUserRole(2n, 'fan', operatorId)).rejects.toMatchObject({
      message: '不能修改站主的角色',
      code: 403,
    })
  })

  it('rejects changing own role', async () => {
    vi.mocked(prisma.users.findUnique).mockResolvedValue({
      id: operatorId,
      username: 'helper',
      role: 'admin',
    } as never)

    await expect(updateUserRole(operatorId, 'fan', operatorId)).rejects.toMatchObject({
      message: '不能修改自己的角色',
      code: 403,
    })
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import bcrypt from 'bcryptjs'

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
    users: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { prisma } from '../src/lib/prisma'
import { changePassword } from '../src/services/user.service'

describe('changePassword', () => {
  const userId = 1n

  beforeEach(() => {
    redisStore.clear()
    vi.mocked(redisMock.get).mockClear()
    vi.mocked(redisMock.set).mockClear()
    vi.mocked(prisma.users.update).mockReset()
  })

  it('rejects wrong current password and starts cooldown', async () => {
    const hash = await bcrypt.hash('123456', 4)
    vi.mocked(prisma.users.findUnique).mockResolvedValue({
      id: userId,
      password_hash: hash,
    } as never)

    await expect(changePassword(userId, 'wrong', 'newpass1')).rejects.toMatchObject({
      message: '当前密码错误',
      code: 400,
    })

    await expect(changePassword(userId, '123456', 'newpass1')).rejects.toMatchObject({
      code: 429,
    })
    expect(prisma.users.update).not.toHaveBeenCalled()
  })

  it('updates hash when current password matches', async () => {
    const hash = await bcrypt.hash('123456', 4)
    vi.mocked(prisma.users.findUnique).mockResolvedValue({
      id: userId,
      password_hash: hash,
    } as never)
    vi.mocked(prisma.users.update).mockResolvedValue({} as never)

    await changePassword(userId, '123456', 'newpass1')

    expect(prisma.users.update).toHaveBeenCalledTimes(1)
    const payload = vi.mocked(prisma.users.update).mock.calls[0][0]
    expect(payload.where).toEqual({ id: userId })
    const nextHash = (payload.data as { password_hash: string }).password_hash
    expect(await bcrypt.compare('newpass1', nextHash)).toBe(true)
  })

  it('returns 404 when user is missing', async () => {
    vi.mocked(prisma.users.findUnique).mockResolvedValue(null)
    await expect(changePassword(userId, '123456', 'newpass1')).rejects.toMatchObject({
      code: 404,
    })
  })
})

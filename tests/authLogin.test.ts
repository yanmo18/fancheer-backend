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
      del: vi.fn(async (key: string) => {
        store.delete(key)
        return 1
      }),
    },
  }
})

vi.mock('../src/config/redis', () => ({
  default: redisMock,
}))

vi.mock('../src/config/jwt', () => ({
  signToken: vi.fn(() => 'test-token'),
  verifyToken: vi.fn(),
}))

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    users: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    avatars: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from '../src/lib/prisma'
import { signToken } from '../src/config/jwt'
import { login } from '../src/services/auth.service'

describe('login', () => {
  const userId = 8n

  async function mockUser(overrides: Record<string, unknown> = {}) {
    const passwordHash = await bcrypt.hash('123456', 4)
    vi.mocked(prisma.users.findUnique).mockResolvedValue({
      id: userId,
      username: 'fan001',
      nickname: '访客',
      password_hash: passwordHash,
      role: 'fan',
      status: 'active',
      avatar_id: null,
      ...overrides,
    } as never)
  }

  beforeEach(() => {
    redisStore.clear()
    vi.mocked(prisma.users.findUnique).mockReset()
    vi.mocked(prisma.users.update).mockReset()
    vi.mocked(prisma.avatars.findUnique).mockReset()
    vi.mocked(signToken).mockClear()
    vi.mocked(prisma.users.update).mockResolvedValue({} as never)
  })

  it('returns a token for a valid password', async () => {
    await mockUser()

    const result = await login({
      username: ' fan001 ',
      password: '123456',
      clientIp: '127.0.0.1',
    })

    expect(result.token).toBe('test-token')
    expect(result.user.username).toBe('fan001')
    expect(result.user.role).toBe('fan')
    expect(signToken).toHaveBeenCalled()
    expect(prisma.users.update).toHaveBeenCalled()
  })

  it('rejects a wrong password', async () => {
    await mockUser()

    await expect(
      login({ username: 'fan001', password: 'wrongpw', clientIp: '127.0.0.1' }),
    ).rejects.toMatchObject({
      message: '用户名或密码错误',
      code: 400,
    })
    expect(signToken).not.toHaveBeenCalled()
  })

  it('rejects a banned account after password matches', async () => {
    await mockUser({ status: 'banned' })

    await expect(
      login({ username: 'fan001', password: '123456', clientIp: '127.0.0.1' }),
    ).rejects.toMatchObject({
      message: '账号已被封禁，请联系管理员',
      code: 403,
    })
    expect(signToken).not.toHaveBeenCalled()

    await expect(
      login({ username: 'fan001', password: '123456', clientIp: '127.0.0.1' }),
    ).rejects.toMatchObject({ code: 403 })
  })
})

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

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    users: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 1n }),
    },
    avatars: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from '../src/lib/prisma'
import authService from '../src/services/auth.service'

describe('authService.register rate limit', () => {
  beforeEach(() => {
    redisStore.clear()
    vi.mocked(redisMock.get).mockClear()
    vi.mocked(redisMock.set).mockClear()
    vi.mocked(prisma.users.findUnique).mockResolvedValue(null)
  })

  it('blocks repeated register attempts from same IP within cooldown', async () => {
    const payload = {
      username: 'fan002',
      password: '123456',
      captchaId: 'cid',
      captchaText: 'abcd',
      clientIp: '127.0.0.1',
    }

    redisStore.set('cid:svg_captcha', 'abcd')

    await authService.register(payload)
    await expect(authService.register(payload)).rejects.toMatchObject({
      message: '注册过于频繁，请60秒后再试',
      code: 429,
    })
  })

  it('sets cooldown even when username already exists', async () => {
    vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ id: 9n } as never)

    redisStore.set('cid:svg_captcha', 'abcd')

    await expect(
      authService.register({
        username: 'exists',
        password: '123456',
        captchaId: 'cid',
        captchaText: 'abcd',
        clientIp: '10.0.0.2',
      }),
    ).rejects.toMatchObject({ code: 409 })

    await expect(
      authService.register({
        username: 'exists2',
        password: '123456',
        captchaId: 'cid',
        captchaText: 'abcd',
        clientIp: '10.0.0.2',
      }),
    ).rejects.toMatchObject({ code: 429 })
  })
})

describe('authService.getCaptcha rate limit', () => {
  beforeEach(() => {
    redisStore.clear()
  })

  it('blocks captcha requests within cooldown window', async () => {
    await authService.getCaptcha('192.168.1.1')
    await expect(authService.getCaptcha('192.168.1.1')).rejects.toMatchObject({
      code: 429,
    })
  })
})

describe('authService.login rate limit', () => {
  beforeEach(() => {
    redisStore.clear()
    vi.mocked(prisma.users.findUnique).mockResolvedValue(null)
  })

  it('blocks login by IP after failed attempt', async () => {
    await expect(
      authService.login({ username: 'nobody', password: '123456', clientIp: '10.0.0.9' }),
    ).rejects.toMatchObject({ code: 400 })

    await expect(
      authService.login({ username: 'other', password: '123456', clientIp: '10.0.0.9' }),
    ).rejects.toMatchObject({ code: 429 })
  })
})

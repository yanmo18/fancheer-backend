import { describe, expect, it, vi } from 'vitest'
import request from 'supertest'

vi.mock('../src/config/redis', () => ({
  default: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    ping: vi.fn().mockResolvedValue('PONG'),
  },
}))

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '1': 1 }]),
  },
}))

import app from '../src/app'

describe('app smoke', () => {
  it('GET / returns running status', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.body.code).toBe(0)
    expect(res.body.data.status).toBe('running')
  })

  it('GET /api/health returns ok when dependencies are up', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.code).toBe(0)
    expect(res.body.data.status).toBe('ok')
    expect(res.body.data.database).toBe('connected')
    expect(res.body.data.redis).toBe('connected')
  })
})

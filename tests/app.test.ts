import fs from 'fs'
import path from 'path'
import { describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { UPLOADS_DIR } from '../src/config/paths'

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

  it('GET /api/health returns 503 when the database is down', async () => {
    const { prisma } = await import('../src/lib/prisma')
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('db down'))
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(503)
    expect(res.body.code).toBe(503)
  })

  it('GET unknown API returns JSON 404', async () => {
    const res = await request(app).get('/api/no-such-route')
    expect(res.status).toBe(200)
    expect(res.body.code).toBe(404)
  })

  it('sets baseline security headers', async () => {
    const res = await request(app).get('/')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN')
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin')
    expect(res.headers['strict-transport-security']).toBeUndefined()
  })

  it('serves uploads with a one-day cache header', async () => {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
    const file = path.join(UPLOADS_DIR, '_cache-header-test.txt')
    fs.writeFileSync(file, 'ok')
    try {
      const res = await request(app).get('/uploads/_cache-header-test.txt')
      expect(res.status).toBe(200)
      expect(res.headers['cache-control']).toMatch(/max-age=86400/)
    } finally {
      fs.unlinkSync(file)
    }
  })
})

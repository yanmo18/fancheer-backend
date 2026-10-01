import { describe, expect, it, vi } from 'vitest'

vi.mock('../src/config/redis', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}))

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    reports: { count: vi.fn() },
    messages: { count: vi.fn() },
    users: { count: vi.fn() },
    check_ins: { count: vi.fn() },
    banners: { count: vi.fn() },
    gallery_images: { count: vi.fn() },
    songs: { count: vi.fn() },
    activities: { count: vi.fn() },
  },
}))

import { prisma } from '../src/lib/prisma'
import { getDashboardStats } from '../src/services/admin.service'

describe('getDashboardStats', () => {
  it('hides private message count from admin', async () => {
    vi.mocked(prisma.reports.count).mockResolvedValue(2)
    vi.mocked(prisma.messages.count).mockResolvedValue(9)
    vi.mocked(prisma.users.count).mockResolvedValue(10)
    vi.mocked(prisma.check_ins.count).mockResolvedValue(1)
    vi.mocked(prisma.banners.count).mockResolvedValue(3)
    vi.mocked(prisma.gallery_images.count).mockResolvedValue(21)
    vi.mocked(prisma.songs.count).mockResolvedValue(3)
    vi.mocked(prisma.activities.count).mockResolvedValue(8)

    const stats = await getDashboardStats('admin')
    expect(stats.pendingReports).toBe(2)
    expect(stats.privateMessages).toBeNull()
    expect(stats.gallery).toBe(21)
  })

  it('returns private message count for streamer', async () => {
    vi.mocked(prisma.reports.count).mockResolvedValue(0)
    vi.mocked(prisma.messages.count).mockResolvedValue(4)
    vi.mocked(prisma.users.count).mockResolvedValue(3)
    vi.mocked(prisma.check_ins.count).mockResolvedValue(0)
    vi.mocked(prisma.banners.count).mockResolvedValue(0)
    vi.mocked(prisma.gallery_images.count).mockResolvedValue(0)
    vi.mocked(prisma.songs.count).mockResolvedValue(0)
    vi.mocked(prisma.activities.count).mockResolvedValue(0)

    const stats = await getDashboardStats('streamer')
    expect(stats.privateMessages).toBe(4)
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    check_ins: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { prisma } from '../src/lib/prisma'
import {
  checkin,
  computeCurrentStreak,
  getCheckinStats,
} from '../src/services/checkin.service'

describe('computeCurrentStreak', () => {
  it('counts consecutive days including today', () => {
    expect(computeCurrentStreak(['2026-08-23', '2026-08-22', '2026-08-21'], '2026-08-23')).toBe(3)
  })

  it('keeps streak if today is not checked but yesterday is', () => {
    expect(computeCurrentStreak(['2026-08-22', '2026-08-21'], '2026-08-23')).toBe(2)
  })

  it('resets when yesterday was missed', () => {
    expect(computeCurrentStreak(['2026-08-20'], '2026-08-23')).toBe(0)
  })
})

describe('checkin', () => {
  const userId = 3n

  beforeEach(() => {
    vi.mocked(prisma.check_ins.findFirst).mockReset()
    vi.mocked(prisma.check_ins.create).mockReset()
    vi.mocked(prisma.check_ins.findMany).mockReset()
  })

  it('rejects a second checkin on the same day', async () => {
    vi.mocked(prisma.check_ins.findFirst).mockResolvedValue({ id: 1n } as never)

    await expect(checkin(userId)).rejects.toMatchObject({
      message: '今天已经打过卡了',
      code: 400,
    })
    expect(prisma.check_ins.create).not.toHaveBeenCalled()
  })

  it('creates a checkin when none exists today', async () => {
    vi.mocked(prisma.check_ins.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.check_ins.create).mockResolvedValue({} as never)

    const result = await checkin(userId)

    expect(result.checked).toBe(true)
    expect(prisma.check_ins.create).toHaveBeenCalledTimes(1)
  })

  it('returns total days and streak', async () => {
    const today = dayjs().tz('Asia/Shanghai').format('YYYY-MM-DD')
    const yesterday = dayjs().tz('Asia/Shanghai').subtract(1, 'day').format('YYYY-MM-DD')
    // DATE 字段按 UTC 零点日历日存储/读取
    vi.mocked(prisma.check_ins.findMany).mockResolvedValue([
      { check_date: new Date(`${today}T00:00:00.000Z`) },
      { check_date: new Date(`${yesterday}T00:00:00.000Z`) },
    ] as never)

    const stats = await getCheckinStats(userId)

    expect(stats.totalDays).toBe(2)
    expect(stats.currentStreak).toBe(2)
    expect(stats.checkedToday).toBe(true)
  })
})

/**
 * 打卡服务
 */

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { prisma } from '../lib/prisma'
import AppError from '../utils/appError'
import { TIMEZONE } from '../config/constants'

dayjs.extend(utc)
dayjs.extend(timezone)

function todayKey() {
  return dayjs().tz(TIMEZONE).format('YYYY-MM-DD')
}

function todayCheckDate() {
  return dayjs().tz(TIMEZONE).startOf('day').toDate()
}

/** 连续天数：今天已打则从今天往回数；今天未打则从昨天起算（断一天则为 0） */
export function computeCurrentStreak(checkedDates: Iterable<string>, today: string) {
  const set = checkedDates instanceof Set ? checkedDates : new Set(checkedDates)
  let cursor = today
  if (!set.has(cursor)) {
    cursor = dayjs(today).subtract(1, 'day').format('YYYY-MM-DD')
    if (!set.has(cursor)) return 0
  }

  let streak = 0
  while (set.has(cursor)) {
    streak += 1
    cursor = dayjs(cursor).subtract(1, 'day').format('YYYY-MM-DD')
  }
  return streak
}

export const checkin = async (userId: bigint) => {
  const today = todayCheckDate()

  const existingCheckin = await prisma.check_ins.findFirst({
    where: {
      user_id: userId,
      check_date: today
    }
  })

  if (existingCheckin) {
    throw new AppError('今天已经打过卡了', 400)
  }

  await prisma.check_ins.create({
    data: {
      user_id: userId,
      check_date: today
    }
  })

  return { checked: true, message: '打卡成功' }
}

export const getCheckinCalendar = async (userId: bigint, year: number, month: number) => {
  const startDate = dayjs().tz(TIMEZONE).year(year).month(month - 1).date(1).startOf('day').toDate()
  const endDate = dayjs().tz(TIMEZONE).year(year).month(month - 1).endOf('month').startOf('day').toDate()

  const checkins = await prisma.check_ins.findMany({
    where: {
      user_id: userId,
      check_date: {
        gte: startDate,
        lte: endDate
      }
    },
    select: { check_date: true, created_at: true }
  })

  const checkedDates = checkins.map(c => dayjs(c.check_date).tz(TIMEZONE).format('YYYY-MM-DD'))
  const checkedAt: Record<string, string> = {}
  for (const row of checkins) {
    const dateKey = dayjs(row.check_date).tz(TIMEZONE).format('YYYY-MM-DD')
    checkedAt[dateKey] = dayjs(row.created_at).tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss')
  }

  return {
    year,
    month,
    checkedDates,
    checkedAt,
  }
}

export const getCheckinStats = async (userId: bigint) => {
  const rows = await prisma.check_ins.findMany({
    where: { user_id: userId },
    select: { check_date: true },
    orderBy: { check_date: 'desc' },
  })

  const checkedDates = rows.map((row) => dayjs(row.check_date).tz(TIMEZONE).format('YYYY-MM-DD'))
  const today = todayKey()

  return {
    totalDays: checkedDates.length,
    currentStreak: computeCurrentStreak(checkedDates, today),
    checkedToday: checkedDates.includes(today),
  }
}

export default {
  checkin,
  getCheckinCalendar,
  getCheckinStats,
}

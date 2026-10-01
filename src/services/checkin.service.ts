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

/** 业务日历日（Asia/Shanghai）YYYY-MM-DD */
export function todayKey() {
  return dayjs().tz(TIMEZONE).format('YYYY-MM-DD')
}

/**
 * MySQL DATE 用「UTC 当天 00:00」存日历日，避免 Shanghai startOf('day')
 * 写成 16:00Z 后被驱动截成前一天。
 */
function dateOnlyToUtcDate(dateKey: string) {
  return dayjs.utc(dateKey).startOf('day').toDate()
}

function formatCheckDate(value: Date) {
  return dayjs.utc(value).format('YYYY-MM-DD')
}

function todayCheckDate() {
  return dateOnlyToUtcDate(todayKey())
}

/** 连续天数：今天已打则从今天往回数；今天未打则从昨天起算（断一天则为 0） */
export function computeCurrentStreak(checkedDates: Iterable<string>, today: string) {
  const set = checkedDates instanceof Set ? checkedDates : new Set(checkedDates)
  let cursor = today
  if (!set.has(cursor)) {
    cursor = dayjs.utc(today).subtract(1, 'day').format('YYYY-MM-DD')
    if (!set.has(cursor)) return 0
  }

  let streak = 0
  while (set.has(cursor)) {
    streak += 1
    cursor = dayjs.utc(cursor).subtract(1, 'day').format('YYYY-MM-DD')
  }
  return streak
}

export const checkin = async (userId: bigint) => {
  const today = todayCheckDate()

  const existingCheckin = await prisma.check_ins.findFirst({
    where: {
      user_id: userId,
      check_date: today,
    },
  })

  if (existingCheckin) {
    throw new AppError('今天已经打过卡了', 400)
  }

  await prisma.check_ins.create({
    data: {
      user_id: userId,
      check_date: today,
    },
  })

  return { checked: true, message: '打卡成功', date: todayKey() }
}

export const getCheckinCalendar = async (userId: bigint, year: number, month: number) => {
  const startKey = dayjs
    .utc()
    .year(year)
    .month(month - 1)
    .date(1)
    .format('YYYY-MM-DD')
  const endKey = dayjs.utc(startKey).endOf('month').format('YYYY-MM-DD')
  const startDate = dateOnlyToUtcDate(startKey)
  const endDate = dateOnlyToUtcDate(endKey)

  const checkins = await prisma.check_ins.findMany({
    where: {
      user_id: userId,
      check_date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: { check_date: true, created_at: true },
  })

  const checkedDates = checkins.map((c) => formatCheckDate(c.check_date))
  const checkedAt: Record<string, string> = {}
  for (const row of checkins) {
    const dateKey = formatCheckDate(row.check_date)
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

  const checkedDates = rows.map((row) => formatCheckDate(row.check_date))
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

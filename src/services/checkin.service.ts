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

function todayCheckDate() {
  return dayjs().tz(TIMEZONE).startOf('day').toDate()
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
    select: { check_date: true }
  })

  const checkedDates = checkins.map(c => dayjs(c.check_date).tz(TIMEZONE).format('YYYY-MM-DD'))

  return {
    year,
    month,
    checkedDates
  }
}

export default {
  checkin,
  getCheckinCalendar
}

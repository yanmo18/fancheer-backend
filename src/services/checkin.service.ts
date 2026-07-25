/**
 * 打卡服务
 * 
 * 作用：实现打卡相关业务逻辑（打卡/打卡日历）
 *       与数据库交互、处理业务规则（每日只能打卡一次）
 */

import { prisma } from '../lib/prisma'
import AppError from '../utils/appError'

export const checkin = async (userId: number) => {
  const today = new Date().toISOString().split('T')[0]
  
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

export const getCheckinCalendar = async (userId: number, year: number, month: number) => {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

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

  const checkedDates = new Set(checkins.map(c => c.check_date))

  return {
    year,
    month,
    checkedDates: Array.from(checkedDates)
  }
}

export default {
  checkin,
  getCheckinCalendar
}
/**
 * 举报工单服务
 * 
 * 作用：实现举报工单相关业务逻辑（提交举报/处理举报）
 *       与数据库交互、处理业务规则
 */

import { prisma } from '../lib/prisma'
import AppError from '../utils/appError'

export const createReport = async (userId: number, messageId: number, reason: string) => {
  const message = await prisma.messages.findUnique({ where: { id: messageId } })
  if (!message) {
    throw new AppError('举报消息不存在', 404)
  }

  const existingReport = await prisma.reports.findFirst({
    where: {
      reporter_id: userId,
      message_id: messageId,
      status: 'pending'
    }
  })

  if (existingReport) {
    throw new AppError('您已经举报过这条消息了', 400)
  }

  const report = await prisma.reports.create({
    data: {
      reporter_id: userId,
      message_id: messageId,
      reason,
      status: 'pending'
    },
    select: { id: true }
  })

  return { id: report.id }
}

export const getReports = async (page: number, pageSize: number, status?: string) => {
  const skip = (page - 1) * pageSize

  const whereClause: any = {}
  if (status) {
    whereClause.status = status
  }

  const [list, total] = await Promise.all([
    prisma.reports.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' },
      include: {
        messages: { select: { id: true, content: true, user_id: true } },
        users: { select: { id: true, nickname: true } }
      }
    }),
    prisma.reports.count({ where: whereClause })
  ])

  return {
    list: list.map(report => ({
      id: report.id,
      messageId: report.message_id,
      messageContent: report.messages?.content || '',
      reporterId: report.reporter_id,
      reporterNickname: report.users?.nickname || '',
      reason: report.reason,
      status: report.status,
      createdAt: report.created_at,
      resolvedAt: report.resolved_at
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}

export const handleReport = async (id: number, status: string) => {
  const report = await prisma.reports.findUnique({ where: { id } })
  if (!report) {
    throw new AppError('举报工单不存在', 404)
  }

  await prisma.reports.update({
    where: { id },
    data: {
      status: status as 'resolved',
      resolved_at: new Date()
    }
  })

  if (status === 'resolved') {
    await prisma.admin_logs.create({
      data: {
        admin_id: 1,
        action: 'handle_report',
        target_id: id,
        detail: `处理举报工单: ${id}`
      }
    })
  }
}

export default {
  createReport,
  getReports,
  handleReport
}
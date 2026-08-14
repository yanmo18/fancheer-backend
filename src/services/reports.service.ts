/**
 * 举报工单服务
 */

import { prisma } from '../lib/prisma'
import AppError from '../utils/appError'

export const getReports = async (page: number, pageSize: number, status?: string) => {
  const skip = (page - 1) * pageSize

  const whereClause: { status?: 'pending' | 'resolved' } = {}
  if (status) {
    whereClause.status = status as 'pending' | 'resolved'
  }

  const [list, total] = await Promise.all([
    prisma.reports.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' },
      include: {
        messages: { select: { id: true, content: true, sender_id: true, type: true } },
        users: { select: { id: true, nickname: true } }
      }
    }),
    prisma.reports.count({ where: whereClause })
  ])

  const senderIds = list.map(r => r.messages?.sender_id).filter(Boolean) as bigint[]
  const senders = senderIds.length > 0
    ? await prisma.users.findMany({
        where: { id: { in: senderIds } },
        select: { id: true, nickname: true }
      })
    : []
  const senderMap = new Map(senders.map(s => [s.id.toString(), s.nickname]))

  return {
    list: list.map(report => ({
      id: report.id,
      reporterId: report.reporter_id,
      reporterNickname: report.users?.nickname || '',
      messageId: report.message_id,
      messageContent: report.messages?.content || '',
      messageType: report.messages?.type || '',
      messageSenderId: report.messages?.sender_id || null,
      messageSenderNickname: report.messages?.sender_id
        ? senderMap.get(report.messages.sender_id.toString()) || ''
        : '',
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

export const getReportDetail = async (id: bigint) => {
  const report = await prisma.reports.findUnique({
    where: { id },
    include: {
      messages: {
        select: {
          id: true,
          content: true,
          sender_id: true,
          type: true,
          like_count: true,
          created_at: true,
          _count: { select: { likes: true } }
        }
      },
      users: { select: { id: true, nickname: true, username: true } }
    }
  })

  if (!report) {
    throw new AppError('举报工单不存在', 404)
  }

  const sender = report.messages?.sender_id
    ? await prisma.users.findUnique({
        where: { id: report.messages.sender_id },
        select: { id: true, nickname: true, username: true }
      })
    : null

  const relatedReportCount = await prisma.reports.count({
    where: { message_id: report.message_id }
  })

  return {
    id: report.id,
    reporterId: report.reporter_id,
    reporterNickname: report.users?.nickname || '',
    reporterUsername: report.users?.username || '',
    messageId: report.message_id,
    messageContent: report.messages?.content || '',
    messageType: report.messages?.type || '',
    messageCreatedAt: report.messages?.created_at || null,
    messageLikeCount: report.messages?._count.likes ?? report.messages?.like_count ?? 0,
    messageSenderId: report.messages?.sender_id || null,
    messageSenderNickname: sender?.nickname || '',
    messageSenderUsername: sender?.username || '',
    reason: report.reason,
    status: report.status,
    resolvedAt: report.resolved_at,
    createdAt: report.created_at,
    relatedReportCount
  }
}

export const resolveReport = async (id: bigint, adminId: bigint) => {
  const report = await prisma.reports.findUnique({ where: { id } })
  if (!report) {
    throw new AppError('举报工单不存在', 404)
  }

  if (report.status === 'resolved') {
    throw new AppError('工单已办结', 400)
  }

  await prisma.reports.update({
    where: { id },
    data: { status: 'resolved', resolved_at: new Date() }
  })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'resolve_report',
      target_type: 'report',
      target_id: id,
      detail: `办结举报工单: ${id}`
    }
  })
}

export const deleteViolationMessage = async (reportId: bigint, adminId: bigint) => {
  const report = await prisma.reports.findUnique({
    where: { id: reportId },
    include: { messages: true }
  })

  if (!report) {
    throw new AppError('举报工单不存在', 404)
  }

  if (!report.messages) {
    throw new AppError('关联消息不存在', 404)
  }

  const messageId = report.messages.id

  await prisma.messages.delete({ where: { id: messageId } })

  await prisma.reports.updateMany({
    where: { message_id: messageId },
    data: { status: 'resolved', resolved_at: new Date() }
  })

  await prisma.admin_logs.create({
    data: {
      admin_id: adminId,
      action: 'delete_violation_message',
      target_type: 'message',
      target_id: messageId,
      detail: `删除违规消息: ${messageId}`
    }
  })
}

export default {
  getReports,
  getReportDetail,
  resolveReport,
  deleteViolationMessage
}

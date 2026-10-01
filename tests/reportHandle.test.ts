import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    reports: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    messages: {
      delete: vi.fn(),
    },
    admin_logs: {
      create: vi.fn(),
    },
  },
}))

import { prisma } from '../src/lib/prisma'
import { deleteViolationMessage, resolveReport } from '../src/services/reports.service'

describe('resolveReport', () => {
  const reportId = 4n
  const adminId = 1n

  beforeEach(() => {
    vi.mocked(prisma.reports.findUnique).mockReset()
    vi.mocked(prisma.reports.update).mockReset()
    vi.mocked(prisma.admin_logs.create).mockReset()
    vi.mocked(prisma.reports.update).mockResolvedValue({} as never)
    vi.mocked(prisma.admin_logs.create).mockResolvedValue({} as never)
  })

  it('resolves a pending report with a note', async () => {
    vi.mocked(prisma.reports.findUnique).mockResolvedValue({
      id: reportId,
      status: 'pending',
    } as never)

    await resolveReport(reportId, adminId, ' 已核实并警告 ')

    expect(prisma.reports.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: reportId },
        data: expect.objectContaining({
          status: 'resolved',
          resolution_note: '已核实并警告',
        }),
      }),
    )
    expect(prisma.admin_logs.create).toHaveBeenCalled()
  })

  it('rejects a missing report', async () => {
    vi.mocked(prisma.reports.findUnique).mockResolvedValue(null)
    await expect(resolveReport(reportId, adminId, 'ok')).rejects.toMatchObject({
      message: '举报工单不存在',
      code: 404,
    })
  })

  it('rejects an already resolved report', async () => {
    vi.mocked(prisma.reports.findUnique).mockResolvedValue({
      id: reportId,
      status: 'resolved',
    } as never)
    await expect(resolveReport(reportId, adminId, 'ok')).rejects.toMatchObject({
      message: '工单已办结',
      code: 400,
    })
  })

  it('requires a resolution note', async () => {
    vi.mocked(prisma.reports.findUnique).mockResolvedValue({
      id: reportId,
      status: 'pending',
    } as never)
    await expect(resolveReport(reportId, adminId, '   ')).rejects.toMatchObject({
      message: '请填写处理结果说明',
      code: 400,
    })
  })
})

describe('deleteViolationMessage', () => {
  const reportId = 4n
  const adminId = 1n
  const messageId = 88n

  beforeEach(() => {
    vi.mocked(prisma.reports.findUnique).mockReset()
    vi.mocked(prisma.reports.updateMany).mockReset()
    vi.mocked(prisma.messages.delete).mockReset()
    vi.mocked(prisma.admin_logs.create).mockReset()
    vi.mocked(prisma.reports.updateMany).mockResolvedValue({ count: 1 } as never)
    vi.mocked(prisma.messages.delete).mockResolvedValue({} as never)
    vi.mocked(prisma.admin_logs.create).mockResolvedValue({} as never)
  })

  it('deletes the message and closes related reports', async () => {
    vi.mocked(prisma.reports.findUnique).mockResolvedValue({
      id: reportId,
      resolution_note: null,
      messages: { id: messageId },
    } as never)

    await deleteViolationMessage(reportId, adminId)

    expect(prisma.messages.delete).toHaveBeenCalledWith({ where: { id: messageId } })
    expect(prisma.reports.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { message_id: messageId },
        data: expect.objectContaining({
          status: 'resolved',
          resolution_note: '已删除违规留言',
        }),
      }),
    )
  })

  it('keeps an existing resolution note', async () => {
    vi.mocked(prisma.reports.findUnique).mockResolvedValue({
      id: reportId,
      resolution_note: '确认违规',
      messages: { id: messageId },
    } as never)

    await deleteViolationMessage(reportId, adminId)

    expect(prisma.reports.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ resolution_note: '确认违规' }),
      }),
    )
  })

  it('rejects when the related message is gone', async () => {
    vi.mocked(prisma.reports.findUnique).mockResolvedValue({
      id: reportId,
      messages: null,
    } as never)
    await expect(deleteViolationMessage(reportId, adminId)).rejects.toMatchObject({
      message: '关联消息不存在',
      code: 404,
    })
  })
})

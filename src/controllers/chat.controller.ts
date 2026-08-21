/**
 * 聊天室控制器
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success, fail } from '../utils/response'
import { validateMessage } from '../utils/validate'
import { sanitize } from '../utils/sanitize'
import { checkSensitiveWord } from '../utils/sensitiveWord'
import { parseId, userIdFromRequest } from '../utils/id'
import { parsePagination } from '../utils/pagination'
import chatService from '../services/chat.service'

export const getPublicMessages = async (req: UserRequest, res: Response) => {
  const { before, limit = 20 } = req.query
  const userId = req.user?.id ? userIdFromRequest(req.user.id) : undefined
  const safeLimit = Math.min(Number(limit) || 20, 20)
  const result = await chatService.getPublicMessages(before as string, safeLimit, userId)
  return res.json(success(result))
}

export const getPublicReplies = async (req: UserRequest, res: Response) => {
  const { before, limit = 20 } = req.query
  const safeLimit = Math.min(Number(limit) || 20, 20)
  const result = await chatService.getPublicReplies(before as string, safeLimit)
  return res.json(success(result))
}

export const getPrivateMessages = async (req: UserRequest, res: Response) => {
  const userRole = req.user?.role
  const { page, pageSize } = parsePagination(req.query.page, req.query.pageSize)

  if (userRole !== 'fan') {
    return res.json(fail('仅粉丝可调用此接口', 403))
  }

  const result = await chatService.getPrivateMessages(
    userIdFromRequest(req.user?.id),
    page,
    pageSize
  )
  return res.json(success(result))
}

export const getSentPrivateMessages = async (req: UserRequest, res: Response) => {
  const userRole = req.user?.role
  const { page, pageSize } = parsePagination(req.query.page, req.query.pageSize)

  if (userRole !== 'fan') {
    return res.json(fail('仅粉丝可调用此接口', 403))
  }

  const result = await chatService.getSentPrivateMessages(
    userIdFromRequest(req.user?.id),
    page,
    pageSize
  )
  return res.json(success(result))
}

export const sendMessage = async (req: UserRequest, res: Response) => {
  const { content, type = 'public' } = req.body
  const sanitizedContent = sanitize(content)
  const error = validateMessage(sanitizedContent)
  if (error) return res.json(fail(error, 400))

  const { hasSensitive, matchedWord } = checkSensitiveWord(sanitizedContent)
  if (hasSensitive) return res.json(fail(`消息包含敏感词: ${matchedWord}`, 400))

  if (type !== 'public' && type !== 'private') {
    return res.json(fail('消息类型必须为 public 或 private', 400))
  }

  const result = await chatService.sendMessage(userIdFromRequest(req.user?.id), sanitizedContent, type)
  return res.json(success(result, '发送成功'))
}

export const likeMessage = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const result = await chatService.likeMessage(
    userIdFromRequest(req.user?.id),
    parseId(id, '消息ID')
  )
  return res.json(success(result, '点赞成功'))
}

export const unlikeMessage = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const result = await chatService.unlikeMessage(
    userIdFromRequest(req.user?.id),
    parseId(id, '消息ID')
  )
  return res.json(success(result, '取消点赞成功'))
}

export const reportMessage = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const { reason } = req.body
  const sanitizedReason = sanitize(reason)
  if (!sanitizedReason.trim()) return res.json(fail('请填写举报原因', 400))

  const result = await chatService.reportMessage(
    userIdFromRequest(req.user?.id),
    parseId(id, '消息ID'),
    sanitizedReason
  )
  return res.json(success(result, '举报提交成功，我们会尽快处理'))
}

export const streamerReply = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const { content } = req.body
  const sanitizedContent = sanitize(content)
  const error = validateMessage(sanitizedContent)
  if (error) return res.json(fail(error, 400))

  const { hasSensitive, matchedWord } = checkSensitiveWord(sanitizedContent)
  if (hasSensitive) return res.json(fail(`消息包含敏感词: ${matchedWord}`, 400))

  const result = await chatService.streamerReply(
    userIdFromRequest(req.user?.id),
    parseId(id, '消息ID'),
    sanitizedContent
  )
  return res.json(success(result, '回复成功'))
}

export const privateReply = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const { content, isPublic } = req.body
  const sanitizedContent = sanitize(content)
  const error = validateMessage(sanitizedContent)
  if (error) return res.json(fail(error, 400))

  const { hasSensitive, matchedWord } = checkSensitiveWord(sanitizedContent)
  if (hasSensitive) return res.json(fail(`消息包含敏感词: ${matchedWord}`, 400))

  const result = await chatService.privateReply(
    userIdFromRequest(req.user?.id),
    parseId(id, '消息ID'),
    sanitizedContent,
    isPublic === undefined ? true : Boolean(isPublic)
  )
  return res.json(success(result, isPublic ? '已公开发布回复' : '私密回复成功'))
}

export const getPrivateReplies = async (req: UserRequest, res: Response) => {
  const { id } = req.params
  const result = await chatService.getPrivateReplies(
    parseId(id, '消息ID'),
    userIdFromRequest(req.user?.id),
    req.user!.role
  )
  return res.json(success(result))
}

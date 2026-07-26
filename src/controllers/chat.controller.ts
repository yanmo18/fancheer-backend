/**
 * 聊天室控制器
 * 
 * 作用：处理聊天室相关请求（发送消息/获取消息/点赞/私密消息/举报/回复）
 *       接收请求参数、调用服务层、返回响应
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success, fail } from '../utils/response'
import { validateMessage } from '../utils/validate'
import { sanitize } from '../utils/sanitize'
import chatService from '../services/chat.service'

export const getPublicMessages = async (req: UserRequest, res: Response) => {
  const { before, limit = 20 } = req.query
  const userId = req.user?.id
  const userRole = req.user?.role
  const result = await chatService.getPublicMessages(before as string, Number(limit), userId, userRole)
  return res.json(success(result))
}

export const getPrivateMessages = async (req: UserRequest, res: Response) => {
  const userId = req.user?.id
  const userRole = req.user?.role
  const { page = 1, pageSize = 20 } = req.query

  if (userRole !== 'fan') {
    return res.json(fail('仅粉丝可调用此接口', 403))
  }

  const result = await chatService.getPrivateMessages(userId!, Number(page), Number(pageSize))
  return res.json(success(result))
}

export const sendMessage = async (req: UserRequest, res: Response) => {
  const userId = req.user?.id
  const { content, type = 'public' } = req.body

  const sanitizedContent = sanitize(content)
  const error = validateMessage(sanitizedContent)
  if (error) return res.json(fail(error, 400))

  if (type !== 'public' && type !== 'private') {
    return res.json(fail('消息类型必须为 public 或 private', 400))
  }

  const result = await chatService.sendMessage(userId!, sanitizedContent, type)
  return res.json(success(result, '发送成功'))
}

export const likeMessage = async (req: UserRequest, res: Response) => {
  const userId = req.user?.id
  const { id } = req.params

  const result = await chatService.likeMessage(userId!, Number(id))
  return res.json(success(result, '点赞成功'))
}

export const unlikeMessage = async (req: UserRequest, res: Response) => {
  const userId = req.user?.id
  const { id } = req.params

  const result = await chatService.unlikeMessage(userId!, Number(id))
  return res.json(success(result, '取消点赞成功'))
}

export const reportMessage = async (req: UserRequest, res: Response) => {
  const userId = req.user?.id
  const { id } = req.params
  const { reason } = req.body

  const result = await chatService.reportMessage(userId!, Number(id), sanitize(reason))
  return res.json(success(result, '举报提交成功，我们会尽快处理'))
}

export const streamerReply = async (req: UserRequest, res: Response) => {
  const userId = req.user?.id
  const { id } = req.params
  const { content, replyType = 'public' } = req.body

  const sanitizedContent = sanitize(content)
  const error = validateMessage(sanitizedContent)
  if (error) return res.json(fail(error, 400))

  const result = await chatService.streamerReply(userId!, Number(id), sanitizedContent, replyType)
  return res.json(success(result, '回复成功'))
}

export const privateReply = async (req: UserRequest, res: Response) => {
  const userId = req.user?.id
  const { id } = req.params
  const { content } = req.body

  const sanitizedContent = sanitize(content)
  const error = validateMessage(sanitizedContent)
  if (error) return res.json(fail(error, 400))

  const result = await chatService.privateReply(userId!, Number(id), sanitizedContent)
  return res.json(success(result, '私密回复成功'))
}

export const getPrivateReplies = async (req: UserRequest, res: Response) => {
  const userId = req.user?.id
  const userRole = req.user?.role
  const { id } = req.params

  const result = await chatService.getPrivateReplies(Number(id), userId!, userRole!)
  return res.json(success(result))
}
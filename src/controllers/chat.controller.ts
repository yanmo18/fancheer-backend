/**
 * 聊天室控制器
 * 
 * 作用：处理聊天室相关请求（发送消息/获取消息/点赞/私密消息）
 *       接收请求参数、调用服务层、返回响应
 */

import { Request, Response } from 'express'
import { success, fail } from '../utils/response'
import { validateMessage } from '../utils/validate'
import chatService from '../services/chat.service'

export const getMessages = async (req: Request, res: Response) => {
  const { page = 1, pageSize = 20 } = req.query
  const result = await chatService.getMessages(Number(page), Number(pageSize))
  return res.json(success(result))
}

export const sendMessage = async (req: Request, res: Response) => {
  const userId = req.user?.id
  const { content } = req.body

  const error = validateMessage(content)
  if (error) return res.json(fail(error, 400))

  const result = await chatService.sendMessage(userId!, content)
  return res.json(success(result, '消息发送成功'))
}

export const sendPrivateMessage = async (req: Request, res: Response) => {
  const userId = req.user?.id
  const { content } = req.body

  const error = validateMessage(content)
  if (error) return res.json(fail(error, 400))

  const result = await chatService.sendPrivateMessage(userId!, content)
  return res.json(success(result, '私密消息发送成功'))
}

export const likeMessage = async (req: Request, res: Response) => {
  const userId = req.user?.id
  const { id } = req.params

  const result = await chatService.likeMessage(userId!, Number(id))
  return res.json(success(result))
}

export const getPrivateMessages = async (req: Request, res: Response) => {
  const userId = req.user?.id
  const userRole = req.user?.role
  const { page = 1, pageSize = 20 } = req.query

  const result = await chatService.getPrivateMessages(userId!, userRole!, Number(page), Number(pageSize))
  return res.json(success(result))
}
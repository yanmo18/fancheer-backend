/**
 * 上传控制器
 * 
 * 作用：处理文件上传相关请求
 *       接收请求参数、调用服务层、返回响应
 */

import { Response } from 'express'
import { UserRequest } from '../types'
import { success, fail } from '../utils/response'
import uploadService from '../services/upload.service'

export const uploadImage = async (req: UserRequest, res: Response) => {
  const file = req.file

  if (!file) return res.json(fail('请选择要上传的图片', 400))

  const category = (req.body.category as string) || 'images'
  const result = await uploadService.uploadImage(file, category)
  return res.json(success(result, '图片上传成功'))
}

export const uploadAudio = async (req: UserRequest, res: Response) => {
  const file = req.file

  if (!file) return res.json(fail('请选择要上传的音频', 400))

  const result = await uploadService.uploadAudio(file)
  return res.json(success(result, '音频上传成功'))
}
import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { fail } from '../utils/response'

type MulterMiddleware = (req: Request, res: Response, next: NextFunction) => void

export function wrapMulter(middleware: MulterMiddleware) {
  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.json(fail('文件大小超出限制', 400))
        }
        return res.json(fail(err.message || '文件上传失败', 400))
      }
      if (err) return next(err)
      return next()
    })
  }
}

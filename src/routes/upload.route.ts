import { Router } from 'express'
import multer from 'multer'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'
import { uploadImage, uploadAudio } from '../controllers/upload.controller'
import { UPLOAD } from '../config/constants'
import { wrapMulter } from '../utils/multerWrap'

const router = Router()
const storage = multer.memoryStorage()

const imageUpload = multer({
  storage,
  limits: { fileSize: UPLOAD.MAX_IMAGE_SIZE },
})

const audioUpload = multer({
  storage,
  limits: { fileSize: UPLOAD.MAX_AUDIO_SIZE },
})

router.post(
  '/upload/image',
  authMiddleware,
  requireRole(['admin', 'streamer']),
  wrapMulter(imageUpload.single('file')),
  uploadImage,
)
router.post(
  '/upload/audio',
  authMiddleware,
  requireRole(['admin', 'streamer']),
  wrapMulter(audioUpload.single('file')),
  uploadAudio,
)

export default router

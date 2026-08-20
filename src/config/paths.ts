import path from 'path'

/** 项目根目录（dev / pnpm start / Docker WORKDIR 均指向 backend 根） */
export const PROJECT_ROOT = process.cwd()

/** 用户上传与种子静态文件目录，与 Docker 卷 /app/uploads 一致 */
export const UPLOADS_DIR = path.join(PROJECT_ROOT, 'uploads')

export function uploadsSubdir(...segments: string[]) {
  return path.join(UPLOADS_DIR, ...segments)
}

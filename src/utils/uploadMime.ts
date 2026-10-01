import fs from 'fs'

/** 按文件头判断图片 MIME，避免 JPEG 被存成 .png 后浏览器按错误类型拒绝渲染 */
export function sniffImageContentType(filePath: string): string | null {
  try {
    const fd = fs.openSync(filePath, 'r')
    const buf = Buffer.alloc(12)
    const n = fs.readSync(fd, buf, 0, 12, 0)
    fs.closeSync(fd)
    if (n < 3) return null

    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png'
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif'
    if (
      buf.toString('ascii', 0, 4) === 'RIFF' &&
      buf.toString('ascii', 8, 12) === 'WEBP'
    ) {
      return 'image/webp'
    }
    return null
  } catch {
    return null
  }
}

import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { sniffImageContentType } from '../src/utils/uploadMime'

const TMP = path.join(os.tmpdir(), `fancheer-mime-${process.pid}`)

afterEach(() => {
  if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true, force: true })
})

describe('sniffImageContentType', () => {
  it('detects JPEG even when the file extension is .png', () => {
    fs.mkdirSync(TMP, { recursive: true })
    const filePath = path.join(TMP, 'banner3.png')
    fs.writeFileSync(filePath, Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]))
    expect(sniffImageContentType(filePath)).toBe('image/jpeg')
  })
})

import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { seedUploadFiles } from '../seed-uploads'

const TEST_UPLOADS_DIR = path.join(os.tmpdir(), `fancheer-seed-uploads-${process.pid}`)
const TEST_MARKER = path.join(TEST_UPLOADS_DIR, 'banners', 'banner1.jpg')

describe('seedUploadFiles', () => {
  afterEach(() => {
    if (fs.existsSync(TEST_UPLOADS_DIR)) {
      fs.rmSync(TEST_UPLOADS_DIR, { recursive: true, force: true })
    }
  })

  it('writes compressed upload files into the target directory', async () => {
    const count = await seedUploadFiles({ uploadsDir: TEST_UPLOADS_DIR, force: true })
    expect(count).toBeGreaterThan(0)
    expect(fs.existsSync(TEST_MARKER)).toBe(true)
    expect(fs.statSync(TEST_MARKER).size).toBeGreaterThan(2048)
    expect(fs.statSync(TEST_MARKER).size).toBeLessThan(1024 * 1024)
  }, 60_000)
})

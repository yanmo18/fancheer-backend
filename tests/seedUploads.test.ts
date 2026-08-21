import fs from 'fs'
import path from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { seedUploadFiles } from '../seed-uploads'

const ROOT = path.resolve(import.meta.dirname, '..')
const UPLOADS_DIR = path.join(ROOT, 'uploads')
const TEST_MARKER = path.join(UPLOADS_DIR, 'banners', 'banner1.jpg')

describe('seedUploadFiles', () => {
  afterEach(() => {
    if (fs.existsSync(UPLOADS_DIR)) {
      fs.rmSync(UPLOADS_DIR, { recursive: true, force: true })
    }
  })

  it('writes placeholder uploads when no assets directory exists', () => {
    const count = seedUploadFiles()
    expect(count).toBeGreaterThan(0)
    expect(fs.existsSync(TEST_MARKER)).toBe(true)
  })
})

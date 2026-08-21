import fs from 'fs'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { UPLOADS_DIR } from '../src/config/paths'
import { deleteLocalUpload, replaceLocalUpload } from '../src/services/upload.service'

const testDir = path.join(UPLOADS_DIR, '__vitest_cleanup__')

describe('deleteLocalUpload', () => {
  beforeEach(() => {
    fs.mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('removes local upload file', () => {
    const relative = '__vitest_cleanup__/test-image.webp'
    fs.writeFileSync(path.join(UPLOADS_DIR, relative), 'fake')
    deleteLocalUpload(`/uploads/${relative}`)
    expect(fs.existsSync(path.join(UPLOADS_DIR, relative))).toBe(false)
  })

  it('ignores external URLs', () => {
    expect(() => deleteLocalUpload('https://example.com/a.jpg')).not.toThrow()
  })

  it('replaceLocalUpload removes old file when url changes', () => {
    const oldRelative = '__vitest_cleanup__/old.webp'
    const newRelative = '__vitest_cleanup__/new.webp'
    fs.writeFileSync(path.join(UPLOADS_DIR, oldRelative), 'old')
    fs.writeFileSync(path.join(UPLOADS_DIR, newRelative), 'new')
    replaceLocalUpload(`/uploads/${oldRelative}`, `/uploads/${newRelative}`)
    expect(fs.existsSync(path.join(UPLOADS_DIR, oldRelative))).toBe(false)
    expect(fs.existsSync(path.join(UPLOADS_DIR, newRelative))).toBe(true)
  })

  it('replaceLocalUpload skips when url unchanged', () => {
    const relative = '__vitest_cleanup__/same.webp'
    fs.writeFileSync(path.join(UPLOADS_DIR, relative), 'same')
    replaceLocalUpload(`/uploads/${relative}`, `/uploads/${relative}`)
    expect(fs.existsSync(path.join(UPLOADS_DIR, relative))).toBe(true)
  })
})

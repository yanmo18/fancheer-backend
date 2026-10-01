import { describe, expect, it } from 'vitest'
import { needsTranscodeFromBitrate, probeAudioNeedsTranscode } from '../src/utils/transcodeAudio'
import { UPLOAD } from '../src/config/constants'

describe('needsTranscodeFromBitrate', () => {
  it('uses 192kbps threshold from constants', () => {
    expect(UPLOAD.MAX_AUDIO_BITRATE_KBPS).toBe(192)
    expect(needsTranscodeFromBitrate(193)).toBe(true)
    expect(needsTranscodeFromBitrate(192)).toBe(false)
    expect(needsTranscodeFromBitrate(128)).toBe(false)
    expect(needsTranscodeFromBitrate(null)).toBe(false)
    expect(needsTranscodeFromBitrate(undefined)).toBe(false)
  })
})

describe('probeAudioNeedsTranscode', () => {
  it('skips transcode when buffer is not audio', async () => {
    const result = await probeAudioNeedsTranscode(Buffer.from('not-an-audio-file'))
    expect(result.needsTranscode).toBe(false)
    expect(result.bitrateKbps).toBeNull()
  })
})

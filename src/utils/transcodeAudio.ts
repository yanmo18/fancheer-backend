/**
 * 音频码率检测与转码（超过阈值时压到 192kbps MP3）
 * 依赖 ffmpeg-static；二进制不可用时跳过转码，原样保存。
 */

import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { UPLOAD } from '../config/constants'

export type AudioProbe = {
  bitrateKbps: number | null
  needsTranscode: boolean
}

export function resolveFfmpegPath(): string | null {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ffmpegStatic = require('ffmpeg-static') as string | null
    if (ffmpegStatic && fs.existsSync(ffmpegStatic)) return ffmpegStatic
  } catch {
    /* optional */
  }

  // 系统 PATH 中的 ffmpeg（Windows / Linux / macOS）
  const fromPath = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
  try {
    const { execFileSync } = require('child_process') as typeof import('child_process')
    execFileSync(fromPath, ['-version'], { stdio: 'ignore', windowsHide: true })
    return fromPath
  } catch {
    return null
  }
}

export async function probeAudioBitrateKbps(buffer: Buffer): Promise<number | null> {
  try {
    const { parseBuffer } = await import('music-metadata')
    const meta = await parseBuffer(buffer)
    if (!meta.format.bitrate) return null
    return Math.round(meta.format.bitrate / 1000)
  } catch {
    return null
  }
}

export async function probeAudioNeedsTranscode(buffer: Buffer): Promise<AudioProbe> {
  const bitrateKbps = await probeAudioBitrateKbps(buffer)
  return {
    bitrateKbps,
    needsTranscode: needsTranscodeFromBitrate(bitrateKbps),
  }
}

export function needsTranscodeFromBitrate(bitrateKbps: number | null | undefined): boolean {
  return bitrateKbps != null && bitrateKbps > UPLOAD.MAX_AUDIO_BITRATE_KBPS
}

function runFfmpeg(ffmpegBin: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegBin, args, { windowsHide: true })
    let stderr = ''
    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-500)}`))
    })
  })
}

/** 将输入文件转成 192kbps / 44.1kHz MP3，写到 outputPath */
export async function transcodeToMp3192(inputPath: string, outputPath: string): Promise<void> {
  const ffmpegBin = resolveFfmpegPath()
  if (!ffmpegBin) {
    throw new Error('ffmpeg binary unavailable')
  }

  const outDir = path.dirname(outputPath)
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  await runFfmpeg(ffmpegBin, [
    '-y',
    '-i',
    inputPath,
    '-vn',
    '-codec:a',
    'libmp3lame',
    '-b:a',
    `${UPLOAD.MAX_AUDIO_BITRATE_KBPS}k`,
    '-ar',
    '44100',
    '-ac',
    '2',
    outputPath,
  ])
}

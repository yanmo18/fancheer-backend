import type { Request } from 'express'

function trustProxyEnabled() {
  const v = process.env.TRUST_PROXY
  return v === '1' || v === 'true'
}

export function getClientIp(req: Pick<Request, 'ip' | 'headers'>): string {
  if (trustProxyEnabled()) {
    const forwarded = req.headers['x-forwarded-for']
    if (typeof forwarded === 'string' && forwarded.trim()) {
      return forwarded.split(',')[0].trim()
    }
  }
  return req.ip || 'unknown'
}

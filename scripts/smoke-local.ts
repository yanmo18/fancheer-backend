/**
 * 本地冒烟：公开 API + 静态资源 + 鉴权链路抽样
 * 用法：后端已启动后 pnpm exec tsx scripts/smoke-local.ts
 */
import 'dotenv/config'

const BASE = process.env.SMOKE_BASE || 'http://localhost:3001'

type Check = { name: string; ok: boolean; detail?: string }

async function getJson(path: string, token?: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  const body = await res.json().catch(() => null)
  return { res, body }
}

async function main() {
  const checks: Check[] = []

  const health = await getJson('/api/health')
  checks.push({
    name: 'health',
    ok: health.res.ok && health.body?.data?.database === 'connected' && health.body?.data?.redis === 'connected',
    detail: JSON.stringify(health.body?.data),
  })

  for (const path of [
    '/api/banners',
    '/api/streamer-info',
    '/api/awards',
    '/api/songs',
    '/api/activities',
    '/api/gallery?category=anime',
    '/api/gallery?category=real',
    '/api/graph',
  ]) {
    const { res, body } = await getJson(path)
    checks.push({
      name: path,
      ok: res.ok && body?.code === 0,
      detail: `code=${body?.code} items=${Array.isArray(body?.data) ? body.data.length : typeof body?.data}`,
    })
  }

  const real = await getJson('/api/gallery?category=real')
  const realItems = Array.isArray(real.body?.data) ? real.body.data : []
  let realOk = realItems.length > 0
  for (const item of realItems) {
    const img = await fetch(`${BASE}${item.imageUrl}`)
    const ct = img.headers.get('content-type') || ''
    if (!img.ok || !ct.includes('image')) {
      realOk = false
      checks.push({ name: `real-image ${item.imageUrl}`, ok: false, detail: `${img.status} ${ct}` })
    }
  }
  checks.push({ name: 'real gallery images reachable', ok: realOk, detail: `count=${realItems.length}` })

  const missing = await fetch(`${BASE}/uploads/gallery/__missing__.jpg`)
  checks.push({
    name: 'missing upload returns 404',
    ok: missing.status === 404,
    detail: `status=${missing.status}`,
  })

  const captcha = await getJson('/api/auth/captcha')
  checks.push({
    name: 'captcha',
    ok: captcha.res.ok && Boolean(captcha.body?.data?.captchaId),
    detail: captcha.body?.data?.captchaId ? 'id ok' : JSON.stringify(captcha.body),
  })

  // login with known seed account (may fail if password changed)
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'fan001',
      password: '123456',
      captchaId: captcha.body?.data?.captchaId,
      captchaText: 'skip',
    }),
  })
  const loginBody = await loginRes.json().catch(() => null)
  // captcha will fail — expected; just ensure endpoint responds with business error not 500
  checks.push({
    name: 'login endpoint responds',
    ok: loginRes.status < 500 && loginBody?.code !== undefined,
    detail: `http=${loginRes.status} code=${loginBody?.code} msg=${loginBody?.msg}`,
  })

  const failed = checks.filter((c) => !c.ok)
  for (const c of checks) {
    console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  (${c.detail})` : ''}`)
  }
  console.log(`\n${checks.length - failed.length}/${checks.length} passed`)
  if (failed.length) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

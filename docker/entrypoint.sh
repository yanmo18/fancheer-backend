#!/bin/sh
set -e

echo ">> Waiting for MySQL..."
node <<'NODE'
const net = require('net')
const url = new URL(process.env.DATABASE_URL)
const host = url.hostname
const port = parseInt(url.port, 10) || 3306

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

;(async () => {
  for (let i = 0; i < 60; i++) {
    try {
      await new Promise((resolve, reject) => {
        const socket = net.createConnection({ host, port }, () => {
          socket.end()
          resolve(undefined)
        })
        socket.on('error', reject)
      })
      process.exit(0)
    } catch {
      await sleep(2000)
    }
  }
  console.error('MySQL not ready after 120s')
  process.exit(1)
})()
NODE

echo ">> Syncing database schema..."
pnpm exec prisma db push

if [ "$SEED_ON_START" = "true" ]; then
  if node docker/should-seed.js; then
    echo ">> Seeding database (empty database)..."
    pnpm seed
  else
    echo ">> Skipping seed (database already initialized)"
  fi
fi

echo ">> Starting API server..."
exec node dist/app.js

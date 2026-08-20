/**
 * Exit 0 when the database has no users and seed should run.
 * Exit 1 when users already exist.
 */
require('dotenv').config()

const { PrismaMariaDb } = require('@prisma/adapter-mariadb')
const { PrismaClient } = require('../generated/prisma/client')

async function main() {
  const dbUrl = new URL(process.env.DATABASE_URL)
  const allowPublicKeyRetrieval = dbUrl.searchParams.has('allowPublicKeyRetrieval')
    ? dbUrl.searchParams.get('allowPublicKeyRetrieval') === 'true'
    : ['localhost', '127.0.0.1', 'mysql'].includes(dbUrl.hostname)

  const adapter = new PrismaMariaDb({
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port, 10) || 3306,
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.slice(1).replace(/^\//, ''),
    allowPublicKeyRetrieval,
  })

  const prisma = new PrismaClient({ adapter })

  try {
    const count = await prisma.users.count()
    process.exit(count === 0 ? 0 : 1)
  } catch (error) {
    console.error('Failed to inspect database for seed:', error)
    process.exit(2)
  } finally {
    await prisma.$disconnect()
  }
}

main()

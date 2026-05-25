import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

config({ path: '.env.local', override: true })

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL missing')
  process.exit(1)
}

const pool = new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
  max: 2,
})
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

try {
  const [users, products] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
  ])
  console.log('OK users:', users, 'products:', products)
  try {
    const sacks = await prisma.sackOpen.count()
    console.log('OK sackOpens:', sacks)
  } catch (e) {
    console.warn('SackOpen table:', e.message)
  }
} catch (e) {
  console.error('FAIL:', e.message)
  if (e.code) console.error('code:', e.code)
  if (e.meta) console.error('meta:', e.meta)
  console.error(e)
  process.exit(1)
} finally {
  await prisma.$disconnect()
  await pool.end()
}

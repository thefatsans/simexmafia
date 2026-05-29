/**
 * Creates ProductStockKey table on Supabase (idempotent).
 * Run: npx tsx prisma/apply-product-stock-key.ts
 */
import { readFileSync } from 'fs'
import path from 'path'
import { Pool } from 'pg'

function loadDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }
  try {
    const envFile = readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8')
    const match = envFile.match(/DATABASE_URL="?([^"\n]+)"?/)
    if (match) return match[1]
  } catch {
    // optional
  }
  throw new Error('DATABASE_URL not set')
}

function directUrl(poolerUrl: string): string {
  if (poolerUrl.includes(':6543/')) {
    return poolerUrl.replace(':6543/', ':5432/')
  }
  return poolerUrl
}

async function main() {
  const databaseUrl = directUrl(loadDatabaseUrl())

  if (databaseUrl.includes('supabase') && process.env.NODE_TLS_REJECT_UNAUTHORIZED === undefined) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  }

  const sqlPath = path.resolve(
    process.cwd(),
    'prisma/migrations/20260529120000_add_product_stock_key/migration.sql'
  )
  const sql = readFileSync(sqlPath, 'utf-8')

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('supabase') ? { rejectUnauthorized: false } : undefined,
  })

  try {
    console.log('Applying ProductStockKey migration...')
    await pool.query(sql)
    console.log('Done — ProductStockKey table is ready.')
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})

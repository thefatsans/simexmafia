import { readFileSync } from 'fs'
import { config } from 'dotenv'
import { Pool } from 'pg'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/run-sql-file.mjs <path-to.sql>')
  process.exit(1)
}

config({ path: '.env.local', override: true })
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const sql = readFileSync(file, 'utf8')

try {
  await pool.query(sql)
  console.log('OK:', file)
} catch (e) {
  console.error('FAIL:', e.message)
  process.exit(1)
} finally {
  await pool.end()
}

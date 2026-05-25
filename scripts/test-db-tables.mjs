import { config } from 'dotenv'
import { Pool } from 'pg'

config({ path: '.env.local', override: true })

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const tables = ['User', 'Product', 'Seller', 'CartItem', 'SackOpen']

try {
  for (const table of tables) {
    try {
      const res = await pool.query(`SELECT COUNT(*)::int AS c FROM "${table}"`)
      console.log(`${table}:`, res.rows[0].c)
    } catch (e) {
      console.log(`${table}: ERROR -`, e.message)
    }
  }
} finally {
  await pool.end()
}

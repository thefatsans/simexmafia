// Simple database connection test
const { Pool } = require('pg')

// Load .env.local
try {
  require('dotenv').config({ path: '.env.local' })
} catch (e) {
  // dotenv not available, use direct string
}

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.bvsebymssjcazguyukdi:gNpIQDgC3em18YNh@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require'

console.log('Testing database connection...')
console.log('Connection string:', connectionString.replace(/:[^:@]+@/, ':****@'))

// Set TLS rejection to false for Supabase SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false,
    require: true
  },
  connectionTimeoutMillis: 30000,
})

pool.connect()
  .then((client) => {
    console.log('✅ Connection successful!')
    return client.query('SELECT NOW() as current_time, version() as pg_version')
      .then((res) => {
        console.log('Current time:', res.rows[0].current_time)
        console.log('PostgreSQL version:', res.rows[0].pg_version.split(' ')[0] + ' ' + res.rows[0].pg_version.split(' ')[1])
        client.release()
        pool.end()
        process.exit(0)
      })
  })
  .catch((err) => {
    console.error('❌ Connection failed:')
    console.error('Error code:', err.code)
    console.error('Error message:', err.message)
    console.error('Full error:', err)
    pool.end()
    process.exit(1)
  })


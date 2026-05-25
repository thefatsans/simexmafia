import { getDatabaseUrl, loadLocalEnv } from '@/lib/load-env'
import { resolveSupabaseDatabaseUrl } from '@/lib/database-url'

loadLocalEnv()

// Set TLS rejection to false for Supabase BEFORE any imports
if (getDatabaseUrl()?.includes('supabase') && process.env.NODE_TLS_REJECT_UNAUTHORIZED === undefined) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const rawDatabaseUrl = getDatabaseUrl()
const databaseUrl = rawDatabaseUrl
  ? resolveSupabaseDatabaseUrl(rawDatabaseUrl)
  : undefined

if (!databaseUrl) {
  console.warn('[Prisma] DATABASE_URL is not set. Use .env.local (see .env.example).')
} else if (databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) {
  console.warn(
    '[Prisma] DATABASE_URL points to localhost — check that .env.local overrides the template .env'
  )
}

// Create adapter with fixed connection string
let adapter: PrismaPg | undefined

if (databaseUrl) {
  try {
    const dbUrl = databaseUrl
    const hostMatch = dbUrl.match(/@([^/]+)/)
    console.log('[Prisma] Connecting to:', hostMatch?.[1] || 'unknown')
    console.log('[Prisma] Runtime:', process.env.VERCEL ? 'vercel-serverless' : 'local')

    const pool = new Pool({
      connectionString: dbUrl,
      ssl: dbUrl.includes('supabase') 
        ? {
            rejectUnauthorized: false,
          } as any
        : undefined,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 10000,
      max: process.env.VERCEL || process.env.NODE_ENV === 'production' ? 1 : 5,
      // Retry connection on failure
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    })
    
    pool.on('connect', () => {
      console.log('[Prisma] Database connection established')
    })
    
    pool.on('error', (err) => {
      console.error('[Prisma] Pool error:', err.message)
    })
    
    adapter = new PrismaPg(pool)
    console.log('[Prisma] Connection pool and adapter created successfully')
  } catch (error: any) {
    console.error('[Prisma] Error creating Prisma adapter:', error.message)
    console.warn('[Prisma] Will try without adapter (this may fail with Prisma 7)')
  }
}

// Create Prisma Client with adapter (required for Prisma 7 with PostgreSQL)
export const prisma: PrismaClient | null =
  globalForPrisma.prisma ??
  (databaseUrl
    ? (() => {
        console.log('[Prisma] Creating Prisma Client with adapter')
        try {
          if (!adapter) {
            throw new Error('Adapter not available - cannot create Prisma Client')
          }
          const client = new PrismaClient({
            adapter: adapter,
            log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
          })
          console.log('[Prisma] Prisma Client created successfully with adapter')
          return client
        } catch (error: any) {
          console.error('[Prisma] Error creating Prisma Client:', error.message)
          return null
        }
      })()
    : null)

// Reuse client across hot serverless invocations (Vercel) and local dev
if (prisma) {
  globalForPrisma.prisma = prisma
}


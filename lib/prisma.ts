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
    const isDev = process.env.NODE_ENV === 'development'

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
    
    if (isDev) {
      pool.on('error', (err) => {
        console.error('[Prisma] Pool error:', err.message)
      })
    }
    
    adapter = new PrismaPg(pool)
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
        try {
          if (!adapter) {
            throw new Error('Adapter not available - cannot create Prisma Client')
          }
          return new PrismaClient({
            adapter: adapter,
            log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
          })
        } catch (error: unknown) {
          console.error('[Prisma] Error creating Prisma Client:', error instanceof Error ? error.message : error)
          return null
        }
      })()
    : null)

// Reuse client across hot serverless invocations (Vercel) and local dev
if (prisma) {
  globalForPrisma.prisma = prisma
}


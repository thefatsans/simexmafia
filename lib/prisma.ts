// Set TLS rejection to false for Supabase BEFORE any imports
// This is necessary because Supabase uses self-signed certificates
if (process.env.DATABASE_URL?.includes('supabase') && process.env.NODE_TLS_REJECT_UNAUTHORIZED === undefined) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  console.log('[Prisma] Set NODE_TLS_REJECT_UNAUTHORIZED=0 for Supabase SSL (before imports)')
}

import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// For Prisma 7, we need to ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set. Prisma Client may not work correctly.')
}

// Create adapter with fixed connection string
let adapter: PrismaPg | undefined

if (process.env.DATABASE_URL) {
  try {
    console.log('[Prisma] Initializing connection pool...')
    let dbUrl = process.env.DATABASE_URL
    
    // Fix DATABASE_URL for Supabase if needed
    if (dbUrl.includes('supabase')) {
      // Parse the connection string
      const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^\/:]+)(?::(\d+))?\/([^?]+)(?:\?(.+))?/)
      if (urlMatch) {
        const [, username, password, host, port, database, queryParams] = urlMatch
        let projectRef: string | null = null
        
        // Extract project ref from username if it's in format "postgres.projectref"
        if (username.includes('.')) {
          projectRef = username.split('.')[1]
          console.log('[Prisma] Extracted project ref from username:', projectRef)
        } else {
          // Try to extract from host (db.projectref.supabase.co)
          const dbMatch = host.match(/db\.([^.]+)\.supabase\.co/)
          projectRef = dbMatch?.[1] || null
          if (projectRef) {
            console.log('[Prisma] Extracted project ref from host:', projectRef)
          }
        }
        
        // Use Session Pooler for IPv4 compatibility (recommended by Supabase)
        // Session Pooler format: postgres.projectref@pooler.supabase.com:6543
        // Direct format: postgres@db.projectref.supabase.co:5432 (IPv6 only, not compatible)
        if (projectRef) {
          // If already using pooler, keep it
          if (dbUrl.includes('pooler')) {
            console.log('[Prisma] Using existing pooler connection')
            console.log('[Prisma] Project ref:', projectRef)
          } else {
            // Convert to Session Pooler (IPv4 compatible)
            const poolerHost = `aws-0-eu-central-1.pooler.supabase.com`
            const poolerPort = '6543'
            const poolerUsername = `postgres.${projectRef}`
            const newQuery = queryParams ? `${queryParams}&sslmode=require` : 'sslmode=require'
            
            dbUrl = `postgresql://${poolerUsername}:${password}@${poolerHost}:${poolerPort}/${database}?${newQuery}`
            console.log('[Prisma] Using Session Pooler (IPv4 compatible)')
            console.log('[Prisma] Project ref:', projectRef)
            console.log('[Prisma] Pooler host:', poolerHost)
            console.log('[Prisma] Pooler username:', poolerUsername)
          }
        }
      }
    }
    
    const hostMatch = dbUrl.match(/@([^:]+)/)
    const userMatch = dbUrl.match(/postgresql:\/\/([^:]+):/)
    console.log('[Prisma] DATABASE_URL host:', hostMatch?.[1] || 'unknown')
    console.log('[Prisma] DATABASE_URL user:', userMatch?.[1] || 'unknown')
    
    // Ensure SSL parameters are in the connection string for Supabase
    if (dbUrl.includes('supabase') && !dbUrl.includes('sslmode=')) {
      dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'sslmode=require'
    }
    
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: dbUrl.includes('supabase') 
        ? {
            rejectUnauthorized: false,
          } as any
        : undefined,
      connectionTimeoutMillis: 30000, // Increased timeout for direct connection
      idleTimeoutMillis: 30000,
      max: 10,
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
  (process.env.DATABASE_URL
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

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma
}


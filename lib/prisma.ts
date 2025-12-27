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

// Create PostgreSQL connection pool and adapter for Prisma 7
let adapter: PrismaPg | undefined

if (process.env.DATABASE_URL) {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
    adapter = new PrismaPg(pool)
  } catch (error) {
    console.error('Error creating Prisma adapter:', error)
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma


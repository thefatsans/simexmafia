import { prisma } from '@/lib/prisma'
import { getDatabaseUrl } from '@/lib/load-env'

export async function checkDatabaseConnection(): Promise<{
  configured: boolean
  connected: boolean
  productCount?: number
  userCount?: number
  sackOpenTable?: boolean
  error?: string
  host?: string
}> {
  const url = getDatabaseUrl()

  if (!url) {
    return {
      configured: false,
      connected: false,
      error: 'DATABASE_URL is not set. Add it to .env.local or Vercel Environment Variables.',
    }
  }

  const host = url.match(/@([^/]+)/)?.[1]

  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return {
      configured: true,
      connected: false,
      host,
      error:
        'DATABASE_URL points to localhost. Remove DATABASE_URL from .env and set Supabase URL in .env.local / Vercel.',
    }
  }

  if (!prisma) {
    return {
      configured: true,
      connected: false,
      host,
      error: 'Prisma client could not be initialized (adapter/connection pool failed).',
    }
  }

  try {
    const [productCount, userCount] = await Promise.all([
      prisma.product.count(),
      prisma.user.count(),
    ])

    let sackOpenTable = false
    try {
      await prisma.sackOpen.count()
      sackOpenTable = true
    } catch {
      sackOpenTable = false
    }

    return {
      configured: true,
      connected: true,
      productCount,
      userCount,
      sackOpenTable,
      host,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown database error'
    return {
      configured: true,
      connected: false,
      host,
      error: message,
    }
  }
}

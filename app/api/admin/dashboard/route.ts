import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'
import { loadAdminDashboardData } from '@/lib/admin/load-dashboard'

const ADMIN_CACHE_HEADERS = {
  'Cache-Control': 'private, max-age=30',
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  try {
    const payload = await loadAdminDashboardData()
    return NextResponse.json(payload, { headers: ADMIN_CACHE_HEADERS })
  } catch (err: unknown) {
    console.error('[Admin Dashboard] Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to load dashboard', details: message },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { loadAdminUsers } from '@/lib/admin/load-users'

const ADMIN_CACHE_HEADERS = {
  'Cache-Control': 'private, max-age=15',
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q')?.trim() || ''
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 100)
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10) || 0, 0)

    const payload = await loadAdminUsers({ q, limit, skip })
    return NextResponse.json(payload, { headers: ADMIN_CACHE_HEADERS })
  } catch (error) {
    console.error('[Admin Users API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

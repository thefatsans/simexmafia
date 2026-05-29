import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { loadAdminProducts } from '@/lib/admin/load-products'

const ADMIN_CACHE_HEADERS = {
  'Cache-Control': 'private, max-age=15',
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const includeAll = request.nextUrl.searchParams.get('all') === '1'
    const payload = await loadAdminProducts(includeAll)
    return NextResponse.json(payload, { headers: ADMIN_CACHE_HEADERS })
  } catch (error) {
    console.error('[admin/products] GET failed:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

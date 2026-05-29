import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { loadAdminCashouts, type AdminCashoutStatus } from '@/lib/admin/load-cashouts'

export const dynamic = 'force-dynamic'

const VALID_STATUS = new Set(['pending', 'completed', 'rejected', 'all'])

const ADMIN_CASHOUT_CACHE = {
  'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const status = (request.nextUrl.searchParams.get('status')?.trim() || 'pending') as AdminCashoutStatus
    if (!VALID_STATUS.has(status)) {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 })
    }

    const items = await loadAdminCashouts(status)

    return NextResponse.json(
      { items, total: items.length },
      { headers: ADMIN_CASHOUT_CACHE }
    )
  } catch (error) {
    console.error('[Admin GoofyCoin Cashouts GET]', error)
    return NextResponse.json({ error: 'Umtausch-Anfragen konnten nicht geladen werden' }, { status: 500 })
  }
}

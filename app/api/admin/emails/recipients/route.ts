import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'

/** Liefert E-Mail-Listen für Admin-Versand (Nutzer aus DB) */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  try {
    const verifiedOnly =
      request.nextUrl.searchParams.get('verifiedOnly') === 'true'

    const users = await prisma.user.findMany({
      where: verifiedOnly ? { emailVerified: true } : undefined,
      select: { email: true, firstName: true, lastName: true, emailVerified: true },
      orderBy: { createdAt: 'desc' },
    })

    const emails = users.map((u) => u.email)

    return NextResponse.json({
      users,
      emails,
      total: emails.length,
      verifiedOnly,
    })
  } catch (error) {
    console.error('[Admin Email Recipients] Error:', error)
    return NextResponse.json({ error: 'Failed to load recipients' }, { status: 500 })
  }
}

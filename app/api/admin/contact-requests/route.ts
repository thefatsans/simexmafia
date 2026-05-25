import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'

const VALID_STATUS = new Set(['pending', 'in-progress', 'resolved'])

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  try {
    const url = request.nextUrl
    const q = url.searchParams.get('q')?.trim() || ''
    const status = url.searchParams.get('status')?.trim() || ''

    const where: Record<string, unknown> = {}
    if (status && VALID_STATUS.has(status)) {
      where.status = status
    }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' as const } },
        { email: { contains: q, mode: 'insensitive' as const } },
        { subject: { contains: q, mode: 'insensitive' as const } },
        { message: { contains: q, mode: 'insensitive' as const } },
      ]
    }

    const requests = await prisma.contactRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return NextResponse.json({
      requests: requests.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        category: r.category,
        subject: r.subject,
        message: r.message,
        status: r.status,
        response: r.response,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      total: requests.length,
    })
  } catch (error) {
    console.error('[Admin ContactRequests GET]', error)
    return NextResponse.json({ error: 'Anfragen konnten nicht geladen werden' }, { status: 500 })
  }
}

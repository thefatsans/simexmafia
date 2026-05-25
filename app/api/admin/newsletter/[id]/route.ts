import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    const data: Record<string, unknown> = {}
    if (typeof body.active === 'boolean') {
      data.active = body.active
      data.unsubscribedAt = body.active ? null : new Date()
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nichts zu aktualisieren.' }, { status: 400 })
    }

    const updated = await prisma.newsletter.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      subscriber: {
        id: updated.id,
        email: updated.email,
        active: updated.active,
        subscribedAt: updated.subscribedAt.toISOString(),
        unsubscribedAt: updated.unsubscribedAt ? updated.unsubscribedAt.toISOString() : null,
      },
    })
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === 'P2025') {
      return NextResponse.json({ error: 'Subscriber nicht gefunden.' }, { status: 404 })
    }
    console.error('[Admin Newsletter PATCH]', error)
    return NextResponse.json({ error: 'Update fehlgeschlagen' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  try {
    const { id } = await params
    await prisma.newsletter.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === 'P2025') {
      return NextResponse.json({ error: 'Subscriber nicht gefunden.' }, { status: 404 })
    }
    console.error('[Admin Newsletter DELETE]', error)
    return NextResponse.json({ error: 'Löschen fehlgeschlagen' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'

const VALID_STATUS = new Set(['pending', 'in-progress', 'resolved'])

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
    if (typeof body.status === 'string' && VALID_STATUS.has(body.status)) {
      data.status = body.status
    }
    if ('response' in body) {
      data.response = body.response ? String(body.response) : null
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nichts zu aktualisieren.' }, { status: 400 })
    }

    const updated = await prisma.contactRequest.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      request: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        category: updated.category,
        subject: updated.subject,
        message: updated.message,
        status: updated.status,
        response: updated.response,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    })
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === 'P2025') {
      return NextResponse.json({ error: 'Anfrage nicht gefunden.' }, { status: 404 })
    }
    console.error('[Admin ContactRequest PATCH]', error)
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
    await prisma.contactRequest.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === 'P2025') {
      return NextResponse.json({ error: 'Anfrage nicht gefunden.' }, { status: 404 })
    }
    console.error('[Admin ContactRequest DELETE]', error)
    return NextResponse.json({ error: 'Löschen fehlgeschlagen' }, { status: 500 })
  }
}

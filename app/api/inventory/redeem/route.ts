import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { sendEmailViaResend } from '@/lib/resend-mail'
import { SUPPORT_EMAIL } from '@/lib/company-info'
import { getSiteUrl } from '@/lib/site-url'

function isPrismaAvailable(): boolean {
  try {
    return !!process.env.DATABASE_URL && prisma !== null && typeof (prisma as any).inventoryItem !== 'undefined'
  } catch {
    return false
  }
}

// POST /api/inventory/redeem
// Body: { itemId: string }
// Marks an inventory item as redeemed (status: 'pending') and notifies admin via email
// so the admin can manually deliver the product key.
export async function POST(request: NextRequest) {
  try {
    if (!isPrismaAvailable() || !prisma) {
      return NextResponse.json({ error: 'Datenbank nicht verfügbar' }, { status: 503 })
    }

    const body = await request.json().catch(() => ({}))
    const { itemId } = body || {}

    if (!itemId || typeof itemId !== 'string') {
      return NextResponse.json({ error: 'itemId ist erforderlich' }, { status: 400 })
    }

    const authResult = await getAuthenticatedUser(request, body)
    if (!authResult || authResult.error) {
      return authResult?.error ?? NextResponse.json({ error: 'Authentifizierung erforderlich' }, { status: 401 })
    }
    const user = authResult.user
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentifizierung erforderlich' }, { status: 401 })
    }

    const item = await prisma.inventoryItem.findFirst({
      where: { id: itemId, userId: user.id },
      include: {
        product: {
          include: { seller: true },
        },
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'Inventar-Item nicht gefunden' }, { status: 404 })
    }

    if (item.isRedeemed) {
      return NextResponse.json(
        {
          error: 'Item wurde bereits eingelöst',
          item,
        },
        { status: 409 }
      )
    }

    // Block: redemption for purchase items must go through the order/key flow
    if (item.source === 'purchase' || item.orderId) {
      return NextResponse.json(
        {
          error:
            'Gekaufte Produkte können nicht über diesen Endpunkt eingelöst werden. Der Key wird über die Bestellung bereitgestellt, sobald sie abgeschlossen ist.',
        },
        { status: 400 }
      )
    }

    const updated = await prisma.inventoryItem.update({
      where: { id: item.id },
      data: {
        isRedeemed: true,
        redeemedAt: new Date(),
        redemptionStatus: 'pending',
      },
      include: {
        product: {
          include: { seller: true },
        },
      },
    })

    // Fire-and-forget admin notification (don't block response on email errors)
    const siteUrl = getSiteUrl()
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Neue Einlöse-Anfrage</h1>
          </div>
          <div style="background: #f9f9f9; padding: 28px; border-radius: 0 0 10px 10px;">
            <p>Ein Nutzer möchte ein aus einem Sack gewonnenes Produkt einlösen.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="padding: 6px; color: #666;">Nutzer</td><td style="padding: 6px;"><strong>${user.firstName ?? ''} ${user.lastName ?? ''}</strong></td></tr>
              <tr><td style="padding: 6px; color: #666;">E-Mail</td><td style="padding: 6px;"><a href="mailto:${user.email}">${user.email}</a></td></tr>
              <tr><td style="padding: 6px; color: #666;">User-ID</td><td style="padding: 6px;"><code>${user.id}</code></td></tr>
              <tr><td style="padding: 6px; color: #666;">Produkt</td><td style="padding: 6px;"><strong>${item.product?.name ?? '?'}</strong></td></tr>
              <tr><td style="padding: 6px; color: #666;">Produkt-ID</td><td style="padding: 6px;"><code>${item.productId}</code></td></tr>
              <tr><td style="padding: 6px; color: #666;">Quelle</td><td style="padding: 6px;">${item.sourceId ?? item.source} (${item.notes ?? '-'})</td></tr>
              <tr><td style="padding: 6px; color: #666;">Inventar-ID</td><td style="padding: 6px;"><code>${item.id}</code></td></tr>
              <tr><td style="padding: 6px; color: #666;">Eingelöst am</td><td style="padding: 6px;">${updated.redeemedAt?.toISOString() ?? '-'}</td></tr>
            </table>
            <p style="margin-top: 24px;">
              <a href="${siteUrl}/admin/redemptions" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Im Admin-Panel öffnen</a>
            </p>
            <p style="font-size: 13px; color: #666; margin-top: 24px;">Bitte sende dem Nutzer den passenden Produkt-Key per E-Mail an <strong>${user.email}</strong>.</p>
          </div>
        </body>
      </html>
    `

    sendEmailViaResend({
      to: SUPPORT_EMAIL,
      subject: `Einlöse-Anfrage: ${item.product?.name ?? 'Produkt'} – ${user.email}`,
      html: adminEmailHtml,
    }).catch((err) => {
      console.error('[Redeem API] Failed to send admin notification email:', err)
    })

    return NextResponse.json({
      success: true,
      item: updated,
      message: 'Anfrage gesendet. Wir senden dir den Key innerhalb von 24 Stunden per E-Mail.',
    })
  } catch (error: any) {
    console.error('[Redeem API] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Unbekannter Fehler beim Einlösen' },
      { status: 500 }
    )
  }
}

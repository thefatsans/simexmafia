import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { requireSecureSession } from '@/lib/api-auth'
import { completeOrder } from '@/lib/orders/complete-order'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentIntentId } = body

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID is required' }, { status: 400 })
    }

    const authResult = await requireSecureSession(request)
    if (!authResult || authResult.error) {
      return authResult?.error || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe secret key not configured' }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    })

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      if (paymentIntent.status === 'requires_payment_method') {
        return NextResponse.json(
          { success: false, error: 'Payment method required', status: paymentIntent.status },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { success: false, error: `Payment status: ${paymentIntent.status}`, status: paymentIntent.status },
        { status: 400 }
      )
    }

    const orderId = paymentIntent.metadata?.orderId as string | undefined
    if (!orderId) {
      return NextResponse.json({ error: 'Payment intent missing orderId metadata' }, { status: 400 })
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, total: true, status: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.userId !== authResult.user.id && !authResult.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const expectedCents = Math.round(Number(order.total) * 100)
    if (paymentIntent.amount !== expectedCents) {
      return NextResponse.json(
        {
          error: `Payment amount mismatch (expected ${expectedCents}, got ${paymentIntent.amount})`,
        },
        { status: 400 }
      )
    }

    if (order.status !== 'completed') {
      try {
        await completeOrder(order.id, 'stripe', { paymentIntentId: paymentIntent.id })
      } catch (err) {
        console.warn('[Stripe Confirm] completeOrder failed:', err)
        return NextResponse.json(
          { error: err instanceof Error ? err.message : 'Order completion failed' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      status: paymentIntent.status,
      orderId,
    })
  } catch (error: unknown) {
    console.error('Error confirming payment:', error)
    const message = error instanceof Error ? error.message : 'Failed to confirm payment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

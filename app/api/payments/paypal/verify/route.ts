import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSecureSession } from '@/lib/api-auth'
import { getPayPalOrder } from '@/lib/paypal'
import { completeOrder } from '@/lib/orders/complete-order'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, paymentId, payerId, amount } = body

    const authResult = await requireSecureSession(request)
    if (!authResult || authResult.error) {
      return authResult?.error || NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const authenticatedUser = authResult.user
    if (!authenticatedUser?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      )
    }

    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      )
    }

    // Get order from database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        total: true,
        status: true,
        paymentMethod: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify order belongs to user
    if (order.userId !== authenticatedUser.id && !authenticatedUser.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Order does not belong to user' },
        { status: 403 }
      )
    }

    // Verify payment method
    if (order.paymentMethod !== 'paypal') {
      return NextResponse.json(
        { success: false, error: 'Order is not a PayPal payment' },
        { status: 400 }
      )
    }

    // Verify amount matches (with small tolerance for rounding)
    const orderAmount = parseFloat(order.total.toString())
    const paymentAmount = amount ? parseFloat(amount.toString()) : null
    if (paymentAmount && Math.abs(orderAmount - paymentAmount) > 0.01) {
      console.warn('[PayPal Verify] Amount mismatch:', {
        orderAmount,
        paymentAmount,
        difference: Math.abs(orderAmount - paymentAmount)
      })
      // Don't fail - amounts might differ due to PayPal fees or rounding
    }

    const verifyPaymentId = (paymentId as string | undefined) || orderId
    if (!verifyPaymentId) {
      return NextResponse.json(
        { success: false, error: 'PayPal payment id missing' },
        { status: 400 }
      )
    }

    let paypalOrder
    try {
      paypalOrder = await getPayPalOrder(verifyPaymentId)
    } catch (err: any) {
      console.error('[PayPal Verify] PayPal API error:', err)
      if (err?.code === 'PAYPAL_NOT_CONFIGURED') {
        return NextResponse.json(
          { success: false, error: 'PayPal verification not configured on server.', code: 'PAYPAL_NOT_CONFIGURED' },
          { status: 503 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'PayPal verification failed.', details: err?.message },
        { status: 502 }
      )
    }

    if (paypalOrder.status !== 'COMPLETED' && paypalOrder.status !== 'APPROVED') {
      return NextResponse.json(
        { success: false, error: `PayPal payment not completed (status: ${paypalOrder.status})` },
        { status: 400 }
      )
    }

    const paypalAmount = paypalOrder.purchase_units?.[0]?.amount?.value
      ? parseFloat(paypalOrder.purchase_units[0].amount.value)
      : (amount ? parseFloat(amount.toString()) : null)
    if (paypalAmount !== null && paypalAmount + 0.01 < orderAmount) {
      return NextResponse.json(
        { success: false, error: `PayPal amount (${paypalAmount}) below order total (${orderAmount}).` },
        { status: 400 }
      )
    }

    try {
      const completed = await completeOrder(order.id, 'paypal', {
        paypalPaymentId: verifyPaymentId,
        paypalPayerId: payerId ?? null,
      })
      return NextResponse.json({
        success: true,
        orderId: completed.id,
        status: completed.status,
        message: 'Payment verified successfully',
      })
    } catch (err: any) {
      console.error('[PayPal Verify] completeOrder error:', err)
      return NextResponse.json(
        { success: false, error: err?.message || 'Order completion failed' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[PayPal Verify] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}



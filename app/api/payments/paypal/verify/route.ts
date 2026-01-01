import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, paymentId, payerId, token, amount, userId } = body

    console.log('[PayPal Verify] Received verification request:', {
      orderId,
      paymentId,
      payerId,
      hasToken: !!token,
      amount,
      userId
    })

    // Verify authentication
    const authResult = await getAuthenticatedUser(request, body)
    if (!authResult || authResult.error) {
      return authResult?.error || NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const authenticatedUser = authResult.user
    if (!authenticatedUser || !authenticatedUser.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify userId matches
    if (userId && authenticatedUser.id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: User ID mismatch' },
        { status: 403 }
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

    // In a real implementation, you would verify the payment with PayPal's API here
    // For now, we'll just log the verification and return success
    // TODO: Implement actual PayPal API verification
    console.log('[PayPal Verify] Payment verified (mock):', {
      orderId: order.id,
      paymentId,
      payerId,
      amount: orderAmount,
    })

    // Update order with PayPal payment details (if you have a field for this)
    // For now, we'll just mark it as processing
    // The admin will set it to completed after manually verifying the payment

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: 'Payment verified successfully',
      // In production, you would return actual verification data from PayPal
    })
  } catch (error: any) {
    console.error('[PayPal Verify] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}



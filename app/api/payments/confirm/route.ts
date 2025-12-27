import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentIntentId } = body

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      )
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe secret key not configured' },
        { status: 500 }
      )
    }

    // Initialize Stripe only when needed (lazy initialization)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    })

    // Retrieve Payment Intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status === 'succeeded') {
      return NextResponse.json({
        success: true,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert from cents
        status: paymentIntent.status,
      })
    } else if (paymentIntent.status === 'requires_payment_method') {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment method required',
          status: paymentIntent.status,
        },
        { status: 400 }
      )
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `Payment status: ${paymentIntent.status}`,
          status: paymentIntent.status,
        },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}



import { NextResponse } from 'next/server'
import { checkDatabaseConnection } from '@/lib/db-health'

// GET /api/health - Health check endpoint
export async function GET() {
  try {
    const database = await checkDatabaseConnection()

    return NextResponse.json({
      status: database.connected ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database,
      environment: process.env.NODE_ENV,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: error.message,
      },
      { status: 500 }
    )
  }
}














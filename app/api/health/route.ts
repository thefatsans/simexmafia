import { NextResponse } from 'next/server'
import { checkDatabaseConfig } from '@/lib/api-error-handler'

// GET /api/health - Health check endpoint
export async function GET() {
  try {
    const dbConfig = checkDatabaseConfig()
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        configured: dbConfig.configured,
        error: dbConfig.error,
      },
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






import { NextResponse } from 'next/server'

/**
 * Handle API errors with proper logging and response
 */
export function handleApiError(error: any, context: string = 'API') {
  console.error(`[${context}] Error:`, error)

  // Prisma errors
  if (error.code) {
    switch (error.code) {
      case 'P1001':
        return NextResponse.json(
          { error: 'Database connection failed. Please check DATABASE_URL configuration.' },
          { status: 503 }
        )
      case 'P2002':
        return NextResponse.json(
          { error: 'Duplicate entry. This record already exists.' },
          { status: 409 }
        )
      case 'P2025':
        return NextResponse.json(
          { error: 'Record not found.' },
          { status: 404 }
        )
      default:
        return NextResponse.json(
          { 
            error: 'Database error occurred',
            code: error.code,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
          },
          { status: 500 }
        )
    }
  }

  // Generic errors
  const errorMessage = error.message || 'An unexpected error occurred'
  const statusCode = error.statusCode || 500

  return NextResponse.json(
    {
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    },
    { status: statusCode }
  )
}

/**
 * Check if DATABASE_URL is configured
 */
export function checkDatabaseConfig(): { configured: boolean; error?: string } {
  if (!process.env.DATABASE_URL) {
    return {
      configured: false,
      error: 'DATABASE_URL is not set in environment variables. Please configure it in .env.local',
    }
  }
  return { configured: true }
}













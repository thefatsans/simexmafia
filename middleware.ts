import { type NextRequest, NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next()
  }

  try {
    return await updateSession(request)
  } catch {
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/account/:path*',
    '/auth/:path*',
    '/api/auth/:path*',
  ],
}

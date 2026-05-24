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
  // Do not run on static assets or Next.js internals (CSS, JS, images)
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|ico|woff2?)$).*)',
  ],
}

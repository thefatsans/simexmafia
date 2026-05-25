import { NextRequest, NextResponse } from 'next/server'
import {
  SESSION_COOKIE_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
  SessionPayload,
  signSession,
  verifySession,
} from '@/lib/session-token'

export interface SessionUserInfo {
  id: string
  email: string
  isAdmin?: boolean
}

export function setSessionCookie(response: NextResponse, user: SessionUserInfo): void {
  const token = signSession({
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin ?? false,
  })
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  })
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

export function readSessionPayload(request: NextRequest): SessionPayload | null {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  return verifySession(token)
}

import type { User } from '@/types/user'

export type AuthApiResponse = {
  success: boolean
  user?: User
  error?: string
  code?: string
  needsVerification?: boolean
  email?: string
  devCode?: string
  message?: string
}

export function isDbUnavailableResponse(result: AuthApiResponse): boolean {
  return (
    result.code === 'DB_UNAVAILABLE' ||
    !!result.error?.includes('Datenbank') ||
    !!result.error?.includes('Verbindung')
  )
}

export async function loginAPI(email: string, password: string): Promise<AuthApiResponse> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[Auth API] Login error:', error)
    return { success: false, error: 'Verbindungsfehler. Bitte versuchen Sie es erneut.' }
  }
}

export async function registerAPI(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  extras?: { captchaToken?: string; referralCode?: string }
): Promise<AuthApiResponse> {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
        captchaToken: extras?.captchaToken,
        referralCode: extras?.referralCode,
      }),
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[Auth API] Register error:', error)
    return { success: false, error: 'Verbindungsfehler. Bitte versuchen Sie es erneut.' }
  }
}

export async function googleLoginAPI(googleData: {
  email: string
  name: string
  picture?: string
}): Promise<AuthApiResponse> {
  try {
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(googleData),
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[Auth API] Google login error:', error)
    return { success: false, error: 'Verbindungsfehler. Bitte versuchen Sie es erneut.' }
  }
}

export async function verifyEmailAPI(
  email: string,
  code: string
): Promise<AuthApiResponse> {
  try {
    const response = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, code }),
    })
    return await response.json()
  } catch (error) {
    console.error('[Auth API] Verify email error:', error)
    return { success: false, error: 'Verbindungsfehler. Bitte versuchen Sie es erneut.' }
  }
}

export async function resendVerificationAPI(email: string): Promise<AuthApiResponse> {
  try {
    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    })
    return await response.json()
  } catch (error) {
    console.error('[Auth API] Resend verification error:', error)
    return { success: false, error: 'Verbindungsfehler. Bitte versuchen Sie es erneut.' }
  }
}

export async function migratePasswordAPI(
  email: string,
  password: string
): Promise<{ success: boolean }> {
  try {
    const response = await fetch('/api/auth/migrate-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })

    return await response.json()
  } catch {
    return { success: false }
  }
}

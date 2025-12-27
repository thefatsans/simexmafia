'use client'

import { useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useRouter } from 'next/navigation'

interface GoogleLoginButtonProps {
  onSuccess?: () => void
  text?: string
}

export default function GoogleLoginButton({ onSuccess, text = 'Mit Google anmelden' }: GoogleLoginButtonProps) {
  const { loginWithGoogle } = useAuth()
  const { showSuccess, showError } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Check if Google Client ID is configured
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  const handleGoogleLoginSuccess = async (tokenResponse: any) => {
    setIsLoading(true)
    try {
      // Check if we have access_token (implicit flow) or code (auth code flow)
      let accessToken = tokenResponse.access_token
      
      // If we have a code instead of access_token, we need to exchange it
      // For now, we'll use the implicit flow which provides access_token directly
      if (!accessToken && tokenResponse.code) {
        // In production, exchange code for token on backend
        showError('Bitte konfigurieren Sie Google OAuth Client ID in .env.local')
        setIsLoading(false)
        return
      }

      if (!accessToken) {
        throw new Error('No access token received from Google')
      }

      // Fetch user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user info from Google')
      }

      const googleUser = await userInfoResponse.json()

      // Call loginWithGoogle with the user data
      const result = await loginWithGoogle({
        email: googleUser.email,
        name: googleUser.name || `${googleUser.given_name || ''} ${googleUser.family_name || ''}`.trim(),
        picture: googleUser.picture,
      })

      if (result.success) {
        showSuccess('Erfolgreich mit Google angemeldet!')
        if (onSuccess) {
          onSuccess()
        } else {
          // Get redirect URL from query params
          const params = new URLSearchParams(window.location.search)
          const redirectUrl = params.get('redirect') || '/account'
          router.push(redirectUrl)
        }
      } else {
        showError(result.error || 'Anmeldung fehlgeschlagen')
      }
    } catch (error) {
      console.error('Google login error:', error)
      showError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLoginError = () => {
    setIsLoading(false)
    showError('Google-Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.')
  }

  // Hook must always be called (Rules of Hooks)
  // But we check if Client ID is configured before using it
  const login = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess,
    onError: handleGoogleLoginError,
  })

  // If Google Client ID is not configured, show a message instead of the button
  if (!googleClientId || googleClientId === 'dummy-client-id') {
    return (
      <div className="w-full py-3 px-4 border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 text-sm rounded-lg text-center">
        Google-Anmeldung ist nicht konfiguriert. Bitte fügen Sie NEXT_PUBLIC_GOOGLE_CLIENT_ID zu .env.local hinzu.
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => login()}
      disabled={isLoading}
      className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-gray-600 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      <span>{isLoading ? 'Wird angemeldet...' : text}</span>
    </button>
  )
}






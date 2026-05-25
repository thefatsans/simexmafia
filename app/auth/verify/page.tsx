'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, ShieldCheck, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { resendVerificationAPI } from '@/lib/api/auth'

function VerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { verifyEmail } = useAuth()
  const { showSuccess, showError, showInfo } = useToast()

  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !code.trim()) {
      showError('E-Mail und Code sind erforderlich')
      return
    }

    setIsLoading(true)
    try {
      const result = await verifyEmail(email.trim(), code.trim())
      if (result.success) {
        showSuccess('E-Mail bestätigt! Willkommen bei SimexMafia.')
        router.push('/account')
      } else {
        showError(result.error || 'Code ungültig')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email.trim()) {
      showError('Bitte E-Mail eingeben')
      return
    }
    setIsResending(true)
    try {
      const result = await resendVerificationAPI(email.trim().toLowerCase())
      if (result.success) {
        showSuccess(result.message || 'Neuer Code wurde gesendet')
        if (result.devCode) {
          showInfo(`Development: Code ist ${result.devCode}`)
        }
      } else {
        showError(result.error || 'Code konnte nicht gesendet werden')
      }
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <ShieldCheck className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">E-Mail bestätigen</h1>
          <p className="mt-2 text-gray-400 text-sm">
            Wir haben dir einen 6-stelligen Code per E-Mail gesendet. Gib ihn hier ein.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">E-Mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-purple-500/30 bg-fortnite-darker text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="deine@email.de"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Bestätigungscode</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-3 py-3 border border-purple-500/30 bg-fortnite-darker text-white rounded-lg text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="000000"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium disabled:opacity-50"
          >
            {isLoading ? 'Wird geprüft…' : 'Konto aktivieren'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="w-full flex items-center justify-center gap-2 py-2 text-purple-400 hover:text-purple-300 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
          Code erneut senden
        </button>

        <p className="text-center text-sm text-gray-500">
          Bereits bestätigt?{' '}
          <a href="/auth/login" className="text-purple-400 hover:text-purple-300">
            Anmelden
          </a>
        </p>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-400">
          Laden…
        </div>
      }
    >
      <VerifyForm />
    </Suspense>
  )
}

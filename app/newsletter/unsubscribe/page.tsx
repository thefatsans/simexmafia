'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Mail, CheckCircle, AlertCircle, Loader } from 'lucide-react'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const emailParam = searchParams.get('email') || ''

  const [email, setEmail] = useState(emailParam)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
    }
  }, [emailParam])

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setErrorMsg('Bitte E-Mail-Adresse eingeben.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setErrorMsg(data.error || `Fehler ${res.status}`)
        setStatus('error')
        return
      }

      setStatus('success')
    } catch (err) {
      console.error('[Unsubscribe]', err)
      setErrorMsg('Abmeldung fehlgeschlagen. Bitte später erneut versuchen.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-fortnite-darker flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-fortnite-dark border border-purple-500/20 rounded-lg p-8 text-center">
        {status === 'success' ? (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Erfolgreich abgemeldet</h1>
            <p className="text-gray-400 mb-6">
              Die E-Mail-Adresse <span className="text-white font-medium">{email}</span> wurde
              von unserem Newsletter abgemeldet. Du wirst keine weiteren Kampagnen erhalten.
            </p>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="inline-block px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all"
            >
              Zur Startseite
            </button>
          </>
        ) : (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
              <Mail className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Newsletter abmelden</h1>
            <p className="text-gray-400 mb-6">
              Gib deine E-Mail-Adresse ein, um dich vom Newsletter abzumelden.
            </p>

            <form onSubmit={handleUnsubscribe} className="space-y-4 text-left">
              <div>
                <label htmlFor="unsub-email" className="block text-sm text-gray-300 mb-1">
                  E-Mail-Adresse
                </label>
                <input
                  id="unsub-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (status === 'error') setStatus('idle')
                  }}
                  placeholder="deine@email.de"
                  required
                  className="w-full px-4 py-3 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {status === 'error' && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-60 text-white font-semibold rounded-lg transition-all"
              >
                {status === 'loading' ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Wird abgemeldet…
                  </>
                ) : (
                  'Abmelden'
                )}
              </button>
            </form>

            <p className="text-gray-500 text-xs mt-6">
              Möchtest du doch abonniert bleiben?{' '}
              <button
                type="button"
                onClick={() => router.push('/')}
                className="text-purple-400 hover:underline"
              >
                Zur Startseite
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-fortnite-darker flex items-center justify-center">
          <Loader className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  )
}

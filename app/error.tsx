'use client'

import { useEffect } from 'react'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-fortnite-darker px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-500/20 rounded-full mb-6">
            <AlertTriangle className="w-12 h-12 text-red-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Ups! Etwas ist schiefgelaufen</h1>
          <p className="text-gray-400 text-lg mb-2">
            Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.
          </p>
          {error.digest && (
            <p className="text-gray-500 text-sm mt-2">
              Fehler-ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Erneut versuchen</span>
          </button>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault()
              window.location.href = '/'
            }}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-fortnite-dark border-2 border-purple-500/50 hover:border-purple-500 text-white font-semibold rounded-lg transition-all"
          >
            <Home className="w-5 h-5" />
            <span>Zur Startseite</span>
          </a>
        </div>

        <div className="mt-12 p-6 bg-fortnite-dark border border-purple-500/20 rounded-lg">
          <h2 className="text-white font-semibold mb-2">Was können Sie tun?</h2>
          <ul className="text-gray-400 text-sm text-left space-y-2">
            <li>• Seite aktualisieren</li>
            <li>• Zur Startseite zurückkehren</li>
            <li>• Später erneut versuchen</li>
            <li>• Kontaktieren Sie uns, wenn das Problem weiterhin besteht</li>
          </ul>
        </div>
      </div>
    </div>
  )
}







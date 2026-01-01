'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

export default function AdminSetupPage() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const createTestUser = () => {
    try {
      // Clear existing users
      localStorage.removeItem('simexmafia-users')
      localStorage.removeItem('simexmafia-user')

      // Create test user
      const testUser = {
        id: 'test-user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password',
        goofyCoins: 500,
        totalSpent: 120.50,
        tier: 'Gold',
        joinDate: new Date().toISOString().split('T')[0],
        avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Test',
      }

      localStorage.setItem('simexmafia-users', JSON.stringify([testUser]))
      setStatus('success')
      setMessage('Test-Benutzer erfolgreich erstellt! Sie können sich jetzt mit test@example.com / password anmelden.')
    } catch (error) {
      setStatus('error')
      setMessage('Fehler beim Erstellen des Test-Benutzers')
      console.error(error)
    }
  }

  useEffect(() => {
    // Check if test user exists
    const usersJson = localStorage.getItem('simexmafia-users')
    if (usersJson) {
      const users = JSON.parse(usersJson)
      const testUser = users.find((u: any) => u.email === 'test@example.com')
      if (testUser) {
        setStatus('success')
        setMessage('Test-Benutzer existiert bereits. Sie können sich mit test@example.com / password anmelden.')
      }
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-fortnite-darker py-12 px-4">
      <div className="max-w-md w-full bg-fortnite-dark border border-purple-500/20 rounded-lg p-8">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Test-Benutzer Setup</h1>
        
        {status === 'idle' && (
          <div className="space-y-4">
            <p className="text-gray-300 text-center">
              Erstellen Sie einen Test-Benutzer für die Anmeldung.
            </p>
            <button
              onClick={createTestUser}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-lg transition-all"
            >
              Test-Benutzer erstellen
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <CheckCircle className="w-16 h-16 text-green-400" />
            </div>
            <p className="text-gray-300 text-center">{message}</p>
            <div className="bg-fortnite-darker border border-purple-500/30 rounded-lg p-4 mt-4">
              <p className="text-white font-semibold mb-2">Anmeldedaten:</p>
              <p className="text-gray-300">E-Mail: <span className="text-purple-400">test@example.com</span></p>
              <p className="text-gray-300">Passwort: <span className="text-purple-400">password</span></p>
            </div>
            <a
              href="/auth/login"
              onClick={(e) => {
                e.preventDefault()
                window.location.href = '/auth/login'
              }}
              className="block w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-center"
            >
              Zum Login
            </a>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <XCircle className="w-16 h-16 text-red-400" />
            </div>
            <p className="text-red-400 text-center">{message}</p>
            <button
              onClick={createTestUser}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}














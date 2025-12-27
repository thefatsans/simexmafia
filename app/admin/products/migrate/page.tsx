'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/data/admin'
import { useToast } from '@/contexts/ToastContext'
import { Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react'

const STORAGE_KEY = 'simexmafia-admin-products'

export default function MigrateProductsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { showSuccess, showError } = useToast()
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<any>(null)

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fortnite-darker">
        <div className="text-white">Lädt...</div>
      </div>
    )
  }

  if (!user || !isAdmin(user.email)) {
    router.push('/auth/login')
    return null
  }

  const handleMigrate = async () => {
    setIsMigrating(true)
    setMigrationResult(null)

    try {
      // Get products from localStorage
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        showError('Keine Produkte in localStorage gefunden')
        setIsMigrating(false)
        return
      }

      let products
      try {
        products = JSON.parse(stored)
      } catch (e) {
        showError('Fehler beim Lesen der Produkte aus localStorage. Die Daten könnten beschädigt sein.')
        setIsMigrating(false)
        return
      }

      if (!Array.isArray(products) || products.length === 0) {
        showError('Keine Produkte zum Migrieren gefunden')
        setIsMigrating(false)
        return
      }

      // Send to API
      const response = await fetch('/api/products/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products }),
      })

      // Check if response is OK and has JSON content
      if (!response.ok) {
        let errorMessage = 'Migration fehlgeschlagen'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      // Parse JSON response
      let result
      try {
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Ungültige Antwort vom Server')
        }
        result = await response.json()
      } catch (e: any) {
        throw new Error('Fehler beim Parsen der Server-Antwort: ' + (e.message || 'Ungültiges JSON'))
      }

      setMigrationResult(result)
      showSuccess(`Erfolgreich ${result.migrated} Produkte migriert!`)
    } catch (error: any) {
      console.error('Migration error:', error)
      showError(error.message || 'Fehler beim Migrieren der Produkte')
      setMigrationResult({ error: error.message })
    } finally {
      setIsMigrating(false)
    }
  }

  return (
    <div className="min-h-screen bg-fortnite-darker py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Produkte von localStorage migrieren
          </h1>
          <p className="text-gray-400 mb-6">
            Diese Seite migriert alle Produkte, die Sie über das Admin-Panel erstellt haben,
            von localStorage in die Datenbank.
          </p>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <p className="text-yellow-300 text-sm">
              ⚠️ <strong>Wichtig:</strong> Seed-Produkte (ID 1-8) werden übersprungen, da sie bereits in der Datenbank sind.
              Nur Ihre selbst erstellten Produkte werden migriert.
            </p>
          </div>

          <button
            onClick={handleMigrate}
            disabled={isMigrating}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
          >
            {isMigrating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Migriere Produkte...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Produkte migrieren</span>
              </>
            )}
          </button>

          {migrationResult && (
            <div className={`mt-6 p-4 rounded-lg ${
              migrationResult.error 
                ? 'bg-red-500/10 border border-red-500/30' 
                : 'bg-green-500/10 border border-green-500/30'
            }`}>
              {migrationResult.error ? (
                <div className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-semibold">Fehler</p>
                    <p className="text-red-300 text-sm">{migrationResult.error}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-400 font-semibold">Erfolgreich!</p>
                    <p className="text-green-300 text-sm">
                      {migrationResult.message}
                    </p>
                    {migrationResult.errors && migrationResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-yellow-300 text-sm font-semibold">Warnungen:</p>
                        <ul className="text-yellow-300 text-sm list-disc list-inside">
                          {migrationResult.errors.map((err: any, idx: number) => (
                            <li key={idx}>{err.product}: {err.error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex space-x-4">
            <button
              onClick={() => router.push('/admin/products')}
              className="flex-1 bg-fortnite-darker hover:bg-purple-500/20 border border-purple-500/30 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Zurück zur Produktverwaltung
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


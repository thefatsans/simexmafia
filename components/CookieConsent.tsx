'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'

const STORAGE_KEY = 'cookie-consent'
type ConsentValue = 'accepted' | 'rejected' | 'necessary'

interface ConsentEntry {
  value: ConsentValue
  timestamp: number
}

declare global {
  interface Window {
    __simexAnalytics?: boolean
    openCookieConsent?: () => void
  }
}

function readConsent(): ConsentEntry | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && parsed.value) return parsed as ConsentEntry
    if (typeof raw === 'string' && (raw === 'accepted' || raw === 'rejected' || raw === 'necessary')) {
      return { value: raw, timestamp: Date.now() }
    }
  } catch {
    /* noop */
  }
  return null
}

function writeConsent(value: ConsentValue) {
  if (typeof window === 'undefined') return
  const entry: ConsentEntry = { value, timestamp: Date.now() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entry))
  window.__simexAnalytics = value === 'accepted'
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const existing = readConsent()
    if (existing) {
      window.__simexAnalytics = existing.value === 'accepted'
    } else {
      setVisible(true)
    }

    window.openCookieConsent = () => setVisible(true)

    return () => {
      try {
        delete window.openCookieConsent
      } catch {
        /* noop */
      }
    }
  }, [])

  const handle = (value: ConsentValue) => {
    writeConsent(value)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed bottom-20 left-3 right-3 lg:bottom-6 lg:left-6 lg:right-auto lg:max-w-md z-[9999] bg-fortnite-dark border border-purple-500/30 rounded-xl shadow-2xl backdrop-blur"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Cookie className="w-5 h-5 text-purple-400" />
            <h2 className="text-white font-semibold">Cookies & Datenschutz</h2>
          </div>
          <button
            type="button"
            aria-label="Banner schließen"
            onClick={() => handle('necessary')}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          Wir verwenden nur notwendige Cookies (Session, Warenkorb). Optionale Analyse-Cookies setzen wir nur mit deiner Zustimmung.
          Mehr in unserer{' '}
          <Link href="/legal/privacy" className="text-purple-300 underline">
            Datenschutzerklärung
          </Link>
          .
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => handle('accepted')}
            className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Alles akzeptieren
          </button>
          <button
            type="button"
            onClick={() => handle('necessary')}
            className="flex-1 px-4 py-2 rounded-lg bg-fortnite-darker border border-purple-500/30 text-white text-sm hover:bg-purple-500/10 transition-all"
          >
            Nur notwendige
          </button>
          <button
            type="button"
            onClick={() => handle('rejected')}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-600 text-gray-300 text-sm hover:bg-gray-800 transition-all"
          >
            Ablehnen
          </button>
        </div>
      </div>
    </div>
  )
}

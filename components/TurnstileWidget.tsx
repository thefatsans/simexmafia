'use client'

import { useEffect, useRef, useState } from 'react'

interface TurnstileWidgetProps {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: () => void
  theme?: 'light' | 'dark' | 'auto'
  className?: string
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string
          theme?: 'light' | 'dark' | 'auto'
          callback?: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
        }
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
    __simexTurnstileLoaded?: boolean
  }
}

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script'

export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
}

function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.__simexTurnstileLoaded && window.turnstile) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(TURNSTILE_SCRIPT_ID)
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      return
    }
    const script = document.createElement('script')
    script.id = TURNSTILE_SCRIPT_ID
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = () => {
      window.__simexTurnstileLoaded = true
      resolve()
    }
    script.onerror = () => reject(new Error('Failed to load Turnstile'))
    document.head.appendChild(script)
  })
}

export default function TurnstileWidget({
  onVerify,
  onExpire,
  onError,
  theme = 'dark',
  className,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const widgetIdRef = useRef<string | null>(null)

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey || !containerRef.current) return
    let cancelled = false

    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          callback: (token: string) => onVerify(token),
          'expired-callback': () => {
            onVerify('')
            onExpire?.()
          },
          'error-callback': () => {
            onVerify('')
            onError?.()
          },
        })
      })
      .catch((err) => {
        console.error('[Turnstile] load error:', err)
        if (!cancelled) setError('Captcha konnte nicht geladen werden.')
      })

    return () => {
      cancelled = true
      try {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current)
        }
      } catch {
        /* noop */
      }
    }
  }, [siteKey, theme, onVerify, onExpire, onError])

  if (!siteKey) return null

  return (
    <div className={className}>
      <div ref={containerRef} />
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  )
}

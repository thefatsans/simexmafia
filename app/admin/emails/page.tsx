'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/data/admin'
import { useToast } from '@/contexts/ToastContext'
import { Mail, Send, Users, FileText, Loader2, AlertCircle } from 'lucide-react'

type EmailType = 'custom' | 'newsletter' | 'announcement'

interface DbUser {
  email: string
  firstName: string
  lastName: string
  emailVerified: boolean
}

export default function AdminEmailsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { showSuccess, showError } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [emailType, setEmailType] = useState<EmailType>('custom')
  const [recipients, setRecipients] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<string[]>([])
  const [dbUsers, setDbUsers] = useState<DbUser[]>([])
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true)
      return
    }

    if (!user) {
      router.push('/auth/login')
      return
    }

    if (!isAdmin(user.email)) {
      router.push('/account')
      return
    }

    setIsLoading(false)
  }, [user, router, authLoading])

  const loadRecipients = useCallback(async () => {
    if (!user || !isAdmin(user.email)) return

    setLoadError(null)
    try {
      const params = verifiedOnly ? '?verifiedOnly=true' : ''
      const res = await fetch(`/api/admin/emails/recipients${params}`, {
        credentials: 'include',
        cache: 'no-store',
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Fehler ${res.status}`)
      }

      const data = await res.json()
      setDbUsers(data.users || [])
    } catch (err) {
      console.error('[Admin Emails] load recipients:', err)
      setLoadError(err instanceof Error ? err.message : 'Empfänger konnten nicht geladen werden')
      setDbUsers([])
    }

    try {
      const subscribers = JSON.parse(
        localStorage.getItem('newsletter-subscribers') || '[]'
      ) as string[]
      setNewsletterSubscribers(
        Array.isArray(subscribers)
          ? subscribers.filter((e) => typeof e === 'string' && e.includes('@'))
          : []
      )
    } catch {
      setNewsletterSubscribers([])
    }
  }, [user, verifiedOnly])

  useEffect(() => {
    if (!authLoading && user && isAdmin(user.email)) {
      loadRecipients()
    }
  }, [authLoading, user, loadRecipients])

  const resolveRecipientList = (): string[] => {
    if (emailType === 'custom') {
      return [
        ...new Set(
          recipients
            .split(/[,\n]/)
            .map((e) => e.trim().toLowerCase())
            .filter((e) => e && /\S+@\S+\.\S+/.test(e))
        ),
      ]
    }

    if (emailType === 'newsletter') {
      return [...new Set(newsletterSubscribers.map((e) => e.trim().toLowerCase()))]
    }

    return [...new Set(dbUsers.map((u) => u.email.toLowerCase()))]
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!subject.trim() || !message.trim()) {
      showError('Bitte füllen Sie Betreff und Nachricht aus')
      return
    }

    const emailRecipients = resolveRecipientList()

    if (emailRecipients.length === 0) {
      if (emailType === 'newsletter') {
        showError(
          'Keine Newsletter-Abonnenten in diesem Browser. Nutze „Ankündigung“ für alle DB-Nutzer oder „Individuell“.'
        )
      } else if (emailType === 'announcement') {
        showError('Keine Benutzer in der Datenbank gefunden')
      } else {
        showError('Bitte mindestens eine gültige E-Mail-Adresse eingeben')
      }
      return
    }

    if (emailRecipients.length > 50) {
      showError(`Maximal 50 Empfänger pro Sendung (aktuell: ${emailRecipients.length})`)
      return
    }

    if (
      emailType === 'announcement' &&
      !confirm(
        `Wirklich an ${emailRecipients.length} Benutzer senden?`
      )
    ) {
      return
    }

    setIsSending(true)

    try {
      const res = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recipients: emailRecipients,
          subject: subject.trim(),
          message: message.trim(),
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        showError(data.error || 'Fehler beim Senden')
        return
      }

      const { successCount = 0, errorCount = 0, failures = [] } = data

      if (successCount > 0) {
        showSuccess(
          `${successCount} E-Mail(s) gesendet${errorCount > 0 ? `, ${errorCount} Fehler` : ''}`
        )
        if (errorCount > 0 && failures.length > 0) {
          console.warn('[Admin Emails] failures:', failures)
        }
        setSubject('')
        setMessage('')
        setRecipients('')
      } else {
        const firstErr = failures[0]?.error || data.error || 'Keine E-Mail gesendet'
        showError(firstErr)
      }
    } catch (error) {
      console.error('Error sending emails:', error)
      showError('Ein Fehler ist aufgetreten beim Senden der E-Mails')
    } finally {
      setIsSending(false)
    }
  }

  const announcementCount = verifiedOnly
    ? dbUsers.filter((u) => u.emailVerified).length
    : dbUsers.length

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fortnite-darker">
        <div className="text-white">Lädt...</div>
      </div>
    )
  }

  if (!user || !isAdmin(user.email)) {
    return null
  }

  return (
    <div className="min-h-screen bg-fortnite-darker py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="text-purple-400 hover:text-purple-300 mb-4 transition-colors"
          >
            ← Zurück zum Dashboard
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">E-Mails versenden</h1>
          <p className="text-gray-400">
            Versand über Resend von <span className="text-purple-300">noreply@simexmafia.de</span>
          </p>
        </div>

        {loadError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm flex gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {loadError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-gray-400 text-sm">Benutzer (Datenbank)</p>
                <p className="text-2xl font-bold text-white">{dbUsers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-gray-400 text-sm">Newsletter (lokal)</p>
                <p className="text-2xl font-bold text-white">{newsletterSubscribers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-gray-400 text-sm">Max. pro Sendung</p>
                <p className="text-2xl font-bold text-white">50</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
          <form onSubmit={handleSendEmail} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Empfänger-Typ
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setEmailType('custom')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    emailType === 'custom'
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-purple-500/30 text-gray-400 hover:border-purple-500/50'
                  }`}
                >
                  <FileText className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-semibold">Individuell</p>
                  <p className="text-xs mt-1">Eigene Adressen</p>
                </button>
                <button
                  type="button"
                  onClick={() => setEmailType('newsletter')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    emailType === 'newsletter'
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-purple-500/30 text-gray-400 hover:border-purple-500/50'
                  }`}
                >
                  <Mail className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-semibold">Newsletter</p>
                  <p className="text-xs mt-1">{newsletterSubscribers.length} (Browser)</p>
                </button>
                <button
                  type="button"
                  onClick={() => setEmailType('announcement')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    emailType === 'announcement'
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-purple-500/30 text-gray-400 hover:border-purple-500/50'
                  }`}
                >
                  <Users className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-semibold">Ankündigung</p>
                  <p className="text-xs mt-1">{announcementCount} Nutzer (DB)</p>
                </button>
              </div>
            </div>

            {emailType === 'announcement' && (
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="rounded border-purple-500/50"
                />
                Nur Benutzer mit bestätigter E-Mail ({dbUsers.filter((u) => u.emailVerified).length})
              </label>
            )}

            {emailType === 'custom' && (
              <div>
                <label htmlFor="recipients" className="block text-sm font-medium text-gray-300 mb-2">
                  Empfänger (kommagetrennt oder je Zeile)
                </label>
                <textarea
                  id="recipients"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  className="w-full px-4 py-3 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={4}
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                Betreff
              </label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                Nachricht
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={10}
                required
              />
            </div>

            {emailType !== 'custom' && (
              <div className="bg-fortnite-darker border border-purple-500/20 rounded-lg p-4 text-sm text-gray-400">
                Es werden{' '}
                <span className="text-purple-400 font-semibold">
                  {emailType === 'newsletter'
                    ? `${newsletterSubscribers.length} Newsletter-Adressen (nur in diesem Browser gespeichert)`
                    : `${announcementCount} registrierte Benutzer aus der Datenbank`}
                </span>{' '}
                angeschrieben (max. 50 pro Klick).
              </div>
            )}

            <button
              type="submit"
              disabled={isSending || !subject.trim() || !message.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white font-semibold px-6 py-4 rounded-lg flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  E-Mail senden
                  {emailType === 'newsletter' && ` (${newsletterSubscribers.length})`}
                  {emailType === 'announcement' && ` (${announcementCount})`}
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-300">
          <strong>Hinweis:</strong> Versand läuft serverseitig über Resend (
          <code className="bg-blue-500/20 px-1 rounded">noreply@simexmafia.de</code>
          ). „Ankündigung“ nutzt alle Konten aus Supabase. Newsletter-Liste ist noch
          browser-lokal — für alle Abonnenten besser „Ankündigung“ verwenden.
        </div>
      </div>
    </div>
  )
}

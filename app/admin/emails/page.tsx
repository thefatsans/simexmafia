'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/data/admin'
import { useToast } from '@/contexts/ToastContext'
import { Mail, Send, Users, FileText, Loader2 } from 'lucide-react'
import { sendEmail } from '@/lib/email'

type EmailType = 'custom' | 'newsletter' | 'announcement'

export default function AdminEmailsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { showSuccess, showError } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [emailType, setEmailType] = useState<EmailType>('custom')
  const [recipients, setRecipients] = useState<string>('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<string[]>([])
  const [allUsers, setAllUsers] = useState<Array<{ email: string; firstName: string; lastName: string }>>([])

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

    // Load newsletter subscribers
    try {
      const subscribers = JSON.parse(localStorage.getItem('newsletter-subscribers') || '[]')
      setNewsletterSubscribers(subscribers)
    } catch (error) {
      console.error('Error loading newsletter subscribers:', error)
    }

    // Load all users
    try {
      const usersJson = localStorage.getItem('simexmafia-users')
      if (usersJson) {
        const users = JSON.parse(usersJson)
        setAllUsers(users.map((u: any) => ({
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
        })))
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }

    setIsLoading(false)
  }, [user, router, authLoading])

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!subject.trim() || !message.trim()) {
      showError('Bitte füllen Sie Betreff und Nachricht aus')
      return
    }

    let emailRecipients: string[] = []

    if (emailType === 'custom') {
      const emails = recipients
        .split(/[,\n]/)
        .map((email) => email.trim())
        .filter((email) => email && /\S+@\S+\.\S+/.test(email))

      if (emails.length === 0) {
        showError('Bitte geben Sie mindestens eine gültige E-Mail-Adresse ein')
        return
      }

      emailRecipients = emails
    } else if (emailType === 'newsletter') {
      if (newsletterSubscribers.length === 0) {
        showError('Keine Newsletter-Abonnenten gefunden')
        return
      }
      emailRecipients = newsletterSubscribers
    } else if (emailType === 'announcement') {
      if (allUsers.length === 0) {
        showError('Keine Benutzer gefunden')
        return
      }
      emailRecipients = allUsers.map((u) => u.email)
    }

    setIsSending(true)

    try {
      // Create HTML email
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">SimexMafia</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <div style="white-space: pre-wrap; font-size: 16px;">${message.replace(/\n/g, '<br>')}</div>
            </div>
            <div style="text-align: center; margin-top: 20px; padding: 20px; color: #999; font-size: 12px;">
              <p>© ${new Date().getFullYear()} SimexMafia. Alle Rechte vorbehalten.</p>
            </div>
          </body>
        </html>
      `

      // Send to all recipients
      let successCount = 0
      let errorCount = 0

      for (const recipient of emailRecipients) {
        try {
          const result = await sendEmail({
            to: recipient,
            subject,
            html,
          })

          if (result.success) {
            successCount++
          } else {
            errorCount++
            console.error(`Failed to send to ${recipient}:`, result.error)
          }
        } catch (error) {
          errorCount++
          console.error(`Error sending to ${recipient}:`, error)
        }
      }

      if (successCount > 0) {
        showSuccess(
          `${successCount} E-Mail(s) erfolgreich gesendet${errorCount > 0 ? `, ${errorCount} Fehler` : ''}`
        )
        // Reset form
        setSubject('')
        setMessage('')
        setRecipients('')
      } else {
        showError('Fehler beim Senden der E-Mails')
      }
    } catch (error) {
      console.error('Error sending emails:', error)
      showError('Ein Fehler ist aufgetreten beim Senden der E-Mails')
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
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
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="text-purple-400 hover:text-purple-300 mb-4 transition-colors"
          >
            ← Zurück zum Dashboard
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">E-Mails versenden</h1>
          <p className="text-gray-400">Sende E-Mails an Benutzer, Newsletter-Abonnenten oder individuelle Empfänger</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-gray-400 text-sm">Alle Benutzer</p>
                <p className="text-2xl font-bold text-white">{allUsers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-gray-400 text-sm">Newsletter-Abonnenten</p>
                <p className="text-2xl font-bold text-white">{newsletterSubscribers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-gray-400 text-sm">E-Mail-Typ</p>
                <p className="text-lg font-bold text-white">
                  {emailType === 'custom'
                    ? 'Individuell'
                    : emailType === 'newsletter'
                    ? 'Newsletter'
                    : 'Ankündigung'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Email Form */}
        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
          <form onSubmit={handleSendEmail} className="space-y-6">
            {/* Email Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Empfänger-Typ</label>
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
                  <p className="text-xs mt-1">Eigene E-Mail-Adressen</p>
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
                  <p className="text-xs mt-1">{newsletterSubscribers.length} Abonnenten</p>
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
                  <p className="text-xs mt-1">{allUsers.length} Benutzer</p>
                </button>
              </div>
            </div>

            {/* Recipients (only for custom) */}
            {emailType === 'custom' && (
              <div>
                <label htmlFor="recipients" className="block text-sm font-medium text-gray-300 mb-2">
                  Empfänger (E-Mail-Adressen, durch Komma oder Zeilenumbruch getrennt)
                </label>
                <textarea
                  id="recipients"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder="email1@example.com, email2@example.com&#10;email3@example.com"
                  className="w-full px-4 py-3 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                  required={emailType === 'custom'}
                />
              </div>
            )}

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                Betreff
              </label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Betreff der E-Mail"
                className="w-full px-4 py-3 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                Nachricht
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ihre Nachricht..."
                className="w-full px-4 py-3 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={10}
                required
              />
              <p className="mt-2 text-sm text-gray-400">
                Zeilenumbrüche werden automatisch in HTML umgewandelt.
              </p>
            </div>

            {/* Preview */}
            {emailType !== 'custom' && (
              <div className="bg-fortnite-darker border border-purple-500/20 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">
                  Diese E-Mail wird an{' '}
                  <span className="text-purple-400 font-semibold">
                    {emailType === 'newsletter'
                      ? `${newsletterSubscribers.length} Newsletter-Abonnenten`
                      : `${allUsers.length} Benutzer`}
                  </span>{' '}
                  gesendet.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSending || !subject.trim() || !message.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Wird gesendet...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>
                    E-Mail senden
                    {emailType === 'newsletter'
                      ? ` (${newsletterSubscribers.length} Empfänger)`
                      : emailType === 'announcement'
                      ? ` (${allUsers.length} Empfänger)`
                      : ''}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            <strong>Hinweis:</strong> Im Development-Modus werden E-Mails nur in der Konsole geloggt. Für
            Production setzen Sie bitte die <code className="bg-blue-500/20 px-2 py-1 rounded">RESEND_API_KEY</code>{' '}
            Environment-Variable.
          </p>
        </div>
      </div>
    </div>
  )
}


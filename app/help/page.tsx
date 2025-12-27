'use client'

import { Search, MessageCircle, Book, Mail, Phone } from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Hilfe-Center</h1>
          <p className="text-xl text-gray-400">
            Finden Sie Antworten auf Ihre Fragen oder kontaktieren Sie unseren Support
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-12">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input
              type="text"
              placeholder="Suchen Sie nach Hilfe..."
              className="w-full pl-14 pr-5 py-4 text-lg bg-fortnite-dark border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <a
            href="/faq"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              window.location.href = '/faq'
            }}
            className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition-all cursor-pointer group"
          >
            <Book className="w-8 h-8 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold text-white mb-2">Häufig gestellte Fragen</h3>
            <p className="text-gray-400">Finden Sie Antworten auf die häufigsten Fragen</p>
          </a>

          <a
            href="/refunds"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              window.location.href = '/refunds'
            }}
            className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition-all cursor-pointer group"
          >
            <MessageCircle className="w-8 h-8 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold text-white mb-2">Rückerstattungen</h3>
            <p className="text-gray-400">Informationen zu Rückerstattungen und Stornierungen</p>
          </a>
        </div>

        {/* Contact Options */}
        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Kontaktieren Sie uns</h2>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <Mail className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">E-Mail Support</h3>
                <p className="text-gray-400 mb-2">Schreiben Sie uns eine E-Mail und wir antworten innerhalb von 24 Stunden.</p>
                <a
                  href="mailto:support@simexmafia.com"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  support@simexmafia.com
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <MessageCircle className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Live Chat</h3>
                <p className="text-gray-400 mb-2">Chatten Sie mit unserem Support-Team (Mo-Fr, 9:00-18:00 Uhr)</p>
                <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors">
                  Chat starten
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Phone className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Telefon Support</h3>
                <p className="text-gray-400 mb-2">Rufen Sie uns an (Mo-Fr, 9:00-18:00 Uhr)</p>
                <a
                  href="tel:+49123456789"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  +49 (0) 123 456 789
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Topics */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Beliebte Themen</h2>
          <div className="space-y-4">
            <a
              href="/faq"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = '/faq'
              }}
              className="block bg-fortnite-dark border border-purple-500/20 rounded-lg p-4 hover:border-purple-500/50 transition-all cursor-pointer"
            >
              <h3 className="text-lg font-semibold text-white mb-1">Wie funktioniert der Kaufprozess?</h3>
              <p className="text-gray-400 text-sm">Erfahren Sie, wie Sie Produkte auf SimexMafia kaufen können</p>
            </a>

            <a
              href="/refunds"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = '/refunds'
              }}
              className="block bg-fortnite-dark border border-purple-500/20 rounded-lg p-4 hover:border-purple-500/50 transition-all cursor-pointer"
            >
              <h3 className="text-lg font-semibold text-white mb-1">Wie kann ich eine Rückerstattung beantragen?</h3>
              <p className="text-gray-400 text-sm">Informationen zu Rückerstattungen und Stornierungen</p>
            </a>

            <a
              href="/account"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = '/account'
              }}
              className="block bg-fortnite-dark border border-purple-500/20 rounded-lg p-4 hover:border-purple-500/50 transition-all cursor-pointer"
            >
              <h3 className="text-lg font-semibold text-white mb-1">Wie verwalte ich mein Konto?</h3>
              <p className="text-gray-400 text-sm">Erfahren Sie, wie Sie Ihr Konto verwalten und Einstellungen ändern</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}








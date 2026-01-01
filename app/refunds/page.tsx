'use client'

import { AlertCircle, CheckCircle, XCircle, Clock, FileText } from 'lucide-react'

export default function RefundsPage() {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Rückerstattungsrichtlinie</h1>
          <p className="text-xl text-gray-400">
            Informationen zu Rückerstattungen und Stornierungen
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-yellow-400 font-semibold mb-2">Wichtiger Hinweis</h3>
              <p className="text-gray-300 text-sm">
                Rückerstattungen werden nur verarbeitet, bevor Sie den digitalen Key einlösen. 
                Nach der Aktivierung kann das Produkt nicht zurückerstattet werden. 
                Überprüfen Sie immer die Verkäuferbewertungen und Produktdetails vor dem Kauf.
              </p>
            </div>
          </div>
        </div>

        {/* Refund Policy */}
        <div className="space-y-8 mb-12">
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">Rückerstattungsberechtigung</h2>
            </div>
            <p className="text-gray-300 mb-4">
              Sie haben Anspruch auf eine vollständige Rückerstattung, wenn:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Sie den digitalen Key noch nicht eingelöst haben</li>
              <li>Der Key nicht funktioniert oder bereits verwendet wurde</li>
              <li>Das Produkt nicht der Beschreibung entspricht</li>
              <li>Sie innerhalb von 14 Tagen nach dem Kauf eine Rückerstattung beantragen</li>
            </ul>
          </div>

          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <XCircle className="w-6 h-6 text-red-400" />
              <h2 className="text-2xl font-bold text-white">Keine Rückerstattung</h2>
            </div>
            <p className="text-gray-300 mb-4">
              Rückerstattungen sind nicht möglich, wenn:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Sie den digitalen Key bereits eingelöst haben</li>
              <li>Mehr als 14 Tage seit dem Kauf vergangen sind</li>
              <li>Sie das Produkt aus persönlichen Gründen nicht mögen</li>
              <li>Sie die falsche Plattform oder Region gekauft haben (bitte überprüfen Sie vor dem Kauf)</li>
            </ul>
          </div>

          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Clock className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Rückerstattungsprozess</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-purple-500/20 text-purple-300 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-semibold">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Rückerstattung beantragen</h3>
                  <p className="text-gray-300">
                    Gehen Sie zu Ihrem Konto → Bestellungen und wählen Sie die Bestellung aus, 
                    für die Sie eine Rückerstattung wünschen. Klicken Sie auf "Rückerstattung beantragen".
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-purple-500/20 text-purple-300 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-semibold">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Grund angeben</h3>
                  <p className="text-gray-300">
                    Geben Sie den Grund für Ihre Rückerstattungsanfrage an und fügen Sie bei Bedarf 
                    Screenshots oder weitere Informationen hinzu.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-purple-500/20 text-purple-300 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-semibold">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Überprüfung</h3>
                  <p className="text-gray-300">
                    Unser Support-Team überprüft Ihre Anfrage innerhalb von 24-48 Stunden. 
                    Sie erhalten eine E-Mail-Benachrichtigung über den Status.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-purple-500/20 text-purple-300 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-semibold">
                  4
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Rückerstattung</h3>
                  <p className="text-gray-300">
                    Wenn Ihre Anfrage genehmigt wird, erhalten Sie die Rückerstattung innerhalb von 
                    5-10 Werktagen auf die ursprüngliche Zahlungsmethode zurück.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Benötigen Sie Hilfe?</h2>
          </div>
          <p className="text-gray-300 mb-4">
            Wenn Sie Fragen zu Rückerstattungen haben oder Hilfe bei der Beantragung benötigen, 
            kontaktieren Sie unseren Support.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="/help"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = '/help'
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition-colors cursor-pointer"
            >
              Hilfe-Center besuchen
            </a>
            <a
              href="/contact"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = '/contact'
              }}
              className="bg-fortnite-darker border border-purple-500/50 hover:border-purple-500 text-white px-6 py-3 rounded-lg transition-colors cursor-pointer"
            >
              Support kontaktieren
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}















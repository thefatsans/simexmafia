import Link from 'next/link'
import { CheckCircle, Mail, ArrowLeft } from 'lucide-react'

export default function NewsletterConfirmationPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500/20 rounded-full mb-6">
            <CheckCircle className="w-16 h-16 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Newsletter erfolgreich abonniert!
          </h1>
          <p className="text-gray-400 text-lg">
            Vielen Dank für Ihr Abonnement. Sie erhalten in Kürze eine Bestätigungs-E-Mail.
          </p>
        </div>

        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-8 mb-8">
          <div className="flex items-start space-x-4 mb-6">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Mail className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold mb-2">Was passiert als Nächstes?</h2>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• Sie erhalten eine Bestätigungs-E-Mail in den nächsten Minuten</li>
                <li>• Wir senden Ihnen wöchentlich die besten Angebote und Neuigkeiten</li>
                <li>• Sie können sich jederzeit abmelden</li>
                <li>• Exklusive Rabatte nur für Newsletter-Abonnenten</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-3 rounded-lg transition-all transform hover:scale-105"
          >
            Zur Startseite
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center bg-fortnite-dark border-2 border-purple-500/50 hover:border-purple-500 text-white font-semibold px-8 py-3 rounded-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Produkte durchsuchen
          </Link>
        </div>
      </div>
    </div>
  )
}








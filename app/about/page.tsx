import Link from 'next/link'
import { Shield, Zap, Star, Users, Award, Heart } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Über SimexMafia</h1>
          <p className="text-xl text-gray-400">
            Ihr vertrauenswürdiger Marktplatz für digitale Gaming-Produkte
          </p>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-purple-900/30 to-yellow-900/30 border border-purple-500/20 rounded-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Willkommen bei SimexMafia</h2>
          <p className="text-gray-300 leading-relaxed text-lg mb-4">
            SimexMafia ist ein digitaler Gaming-Marktplatz, der in Partnerschaft mit Simex, einem der 
            beliebtesten Fortnite-YouTuber Deutschlands, erstellt wurde. Wir sind bestrebt, Gamern die besten 
            Angebote für digitale Spiele, Gutscheine, Abonnements und Spielwährung zu bieten.
          </p>
          <p className="text-gray-300 leading-relaxed text-lg">
            Unsere Mission ist es, Gaming für alle zugänglicher und erschwinglicher zu machen, während wir 
            sichere Transaktionen und exzellenten Kundenservice gewährleisten. Jeder Kauf unterstützt die 
            Gaming-Community und hilft uns, Ihnen noch bessere Angebote zu bringen.
          </p>
        </div>

        {/* Our Story */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">Unsere Geschichte</h2>
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-8">
            <p className="text-gray-300 leading-relaxed mb-4">
              SimexMafia entstand aus einer einfachen Idee: Gamer verdienen bessere Angebote. Gegründet in Partnerschaft 
              mit Simex verstehen wir, was Gamer brauchen und wollen. Wir haben einen Marktplatz aufgebaut, der Käufer 
              mit verifizierten Verkäufern verbindet und Ihnen die besten Preise ohne Kompromisse bei der Sicherheit bietet.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              Was als kleines Projekt begann, ist zu einer vertrauenswürdigen Plattform geworden, auf der täglich Tausende 
              von Gamern ihre Lieblingsspiele, Gutscheine und digitale Produkte finden. Wir sind stolz darauf, Teil der 
              Gaming-Community zu sein und verpflichtet, Gaming für alle zugänglicher zu machen.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Treten Sie noch heute der SimexMafia-Community bei und erleben Sie Gaming-Angebote wie nie zuvor!
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Unsere Werte</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 text-center">
              <Shield className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">Sicherheit zuerst</h3>
              <p className="text-gray-400 text-sm">
                Alle Transaktionen sind sicher und verschlüsselt. Wir verifizieren jeden Verkäufer, um sichere Käufe zu gewährleisten.
              </p>
            </div>
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 text-center">
              <Zap className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">Sofortige Lieferung</h3>
              <p className="text-gray-400 text-sm">
                Erhalten Sie Ihre digitalen Keys sofort nach dem Kauf. Kein Warten, keine Verzögerungen.
              </p>
            </div>
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 text-center">
              <Star className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">Beste Preise</h3>
              <p className="text-gray-400 text-sm">
                Wir arbeiten mit Verkäufern zusammen, um Ihnen konkurrenzfähige Preise zu bieten, die Sie woanders nicht finden.
              </p>
            </div>
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 text-center">
              <Users className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">Community-getrieben</h3>
              <p className="text-gray-400 text-sm">
                Von Gamern für Gamer gebaut. Wir hören unserer Community zu und wachsen gemeinsam.
              </p>
            </div>
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 text-center">
              <Award className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">Verifizierte Verkäufer</h3>
              <p className="text-gray-400 text-sm">
                Jeder Verkäufer ist verifiziert und bewertet. Einkaufen Sie mit Vertrauen, wissen Sie, dass Sie in guten Händen sind.
              </p>
            </div>
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 text-center">
              <Heart className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">Kundensupport</h3>
              <p className="text-gray-400 text-sm">
                Unser Support-Team ist hier, um zu helfen. Wir sind Ihrer Zufriedenheit verpflichtet.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Bereit zum Einkaufen?</h2>
          <p className="text-gray-300 mb-6">
            Schließen Sie sich Tausenden von Gamern an, die SimexMafia für ihre digitalen Gaming-Bedürfnisse vertrauen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-4 rounded-lg transition-all transform hover:scale-105"
            >
              Produkte durchsuchen
            </Link>
            <Link
              href="/contact"
              className="bg-fortnite-dark border-2 border-purple-500/50 hover:border-purple-500 text-white font-semibold px-8 py-4 rounded-lg transition-all"
            >
              Kontaktieren Sie uns
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


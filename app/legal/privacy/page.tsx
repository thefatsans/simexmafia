import { companyInfo, getFullAddress } from '@/lib/company-info'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-12 bg-fortnite-darker">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-white mb-8">Datenschutzerklärung</h1>
        
        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Datenschutz auf einen Blick</h2>
            
            <h3 className="text-xl font-semibold text-white mt-4 mb-2">Allgemeine Hinweise</h3>
            <p className="text-gray-300">
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, 
              wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">Datenerfassung auf dieser Website</h3>
            <p className="text-gray-300 mb-2"><strong className="text-white">Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong></p>
            <p className="text-gray-300">
              Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum 
              dieser Website entnehmen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Hosting</h2>
            <p className="text-gray-300">
              Diese Website wird bei einem externen Dienstleister gehostet (Hoster). Die personenbezogenen Daten, die auf dieser Website 
              erfasst werden, werden auf den Servern des Hosters gespeichert.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Allgemeine Hinweise und Pflichtinformationen</h2>
            
            <h3 className="text-xl font-semibold text-white mt-4 mb-2">Datenschutz</h3>
            <p className="text-gray-300">
              Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten 
              vertraulich und entsprechend den gesetzlichen Datenschutzbestimmungen sowie dieser Datenschutzerklärung.
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">Hinweis zur verantwortlichen Stelle</h3>
            <p className="text-gray-300 mb-2">Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</p>
            <div className="text-gray-300 space-y-1">
              <p>{companyInfo.legalName}</p>
              <p>{companyInfo.address.street}</p>
              <p>{companyInfo.address.zipCode} {companyInfo.address.city}</p>
              <p>{companyInfo.address.country}</p>
              <p className="mt-2">
                E-Mail: <a href={`mailto:${companyInfo.contact.email}`} className="text-purple-400 hover:text-purple-300">{companyInfo.contact.email}</a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Datenerfassung auf dieser Website</h2>
            
            <h3 className="text-xl font-semibold text-white mt-4 mb-2">Cookies</h3>
            <p className="text-gray-300">
              Diese Website nutzt Cookies. Cookies sind kleine Textdateien und richten auf Ihrem Endgerät keinen Schaden an. 
              Sie werden entweder vorübergehend für die Dauer einer Sitzung (Session-Cookies) oder dauerhaft (dauerhafte Cookies) 
              auf Ihrem Endgerät gespeichert.
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">LocalStorage</h3>
            <p className="text-gray-300">
              Diese Website nutzt LocalStorage, um bestimmte Daten lokal in Ihrem Browser zu speichern. 
              Diese Daten werden verwendet, um Ihre Einstellungen, Warenkorb, Wunschliste und andere Präferenzen zu speichern.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Ihre Rechte</h2>
            <p className="text-gray-300 mb-2">Sie haben jederzeit das Recht:</p>
            <ul className="text-gray-300 list-disc list-inside space-y-1 ml-4">
              <li>Auskunft über Ihre bei uns gespeicherten personenbezogenen Daten zu erhalten</li>
              <li>Berichtigung unrichtiger Daten zu verlangen</li>
              <li>Löschung Ihrer bei uns gespeicherten Daten zu verlangen</li>
              <li>Einschränkung der Datenverarbeitung zu verlangen</li>
              <li>Widerspruch gegen die Verarbeitung Ihrer Daten einzulegen</li>
              <li>Datenübertragbarkeit zu verlangen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Kontakt</h2>
            <p className="text-gray-300">
              Bei Fragen zum Datenschutz können Sie uns jederzeit kontaktieren:
            </p>
            <div className="text-gray-300 mt-2">
              <p>
                E-Mail: <a href={`mailto:${companyInfo.contact.email}`} className="text-purple-400 hover:text-purple-300">{companyInfo.contact.email}</a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}





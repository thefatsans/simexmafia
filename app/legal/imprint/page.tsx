import { companyInfo, getFullAddress, getResponsiblePersonAddress } from '@/lib/company-info'

export default function ImprintPage() {
  return (
    <div className="min-h-screen py-12 bg-fortnite-darker">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-white mb-8">Impressum</h1>
        
        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Angaben gemäß § 5 TMG</h2>
            <div className="text-gray-300 space-y-2">
              <p><strong className="text-white">{companyInfo.legalName}</strong></p>
              <p>{companyInfo.address.street}</p>
              <p>{companyInfo.address.zipCode} {companyInfo.address.city}</p>
              <p>{companyInfo.address.country}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Kontakt</h2>
            <div className="text-gray-300 space-y-2">
              <p>
                <strong className="text-white">E-Mail:</strong>{' '}
                <a href={`mailto:${companyInfo.contact.email}`} className="text-purple-400 hover:text-purple-300">
                  {companyInfo.contact.email}
                </a>
              </p>
              <p>
                <strong className="text-white">Telefon:</strong> {companyInfo.contact.phone}
              </p>
              <p>
                <strong className="text-white">Website:</strong>{' '}
                <a href="/" className="text-purple-400 hover:text-purple-300">
                  {companyInfo.contact.website}
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <div className="text-gray-300 space-y-2">
              <p>{companyInfo.responsiblePerson.name}</p>
              <p>{companyInfo.responsiblePerson.address.street}</p>
              <p>{companyInfo.responsiblePerson.address.zipCode} {companyInfo.responsiblePerson.address.city}</p>
              <p>{companyInfo.responsiblePerson.address.country}</p>
            </div>
          </section>

          {companyInfo.legal.disputeResolution.enabled && (
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">EU-Streitschlichtung</h2>
              <p className="text-gray-300">
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
                <a 
                  href={companyInfo.legal.disputeResolution.url}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300"
                >
                  {companyInfo.legal.disputeResolution.url}
                </a>
              </p>
              <p className="text-gray-300 mt-2">
                Unsere E-Mail-Adresse finden Sie oben im Impressum.
              </p>
            </section>
          )}

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
            <p className="text-gray-300">
              {companyInfo.legal.consumerDisputeResolution.participate
                ? `Wir nehmen an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teil. Zuständig ist: ${companyInfo.legal.consumerDisputeResolution.organization}`
                : 'Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.'}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Haftung für Inhalte</h2>
            <p className="text-gray-300">
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. 
              Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen 
              oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Haftung für Links</h2>
            <p className="text-gray-300">
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. 
              Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets 
              der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Urheberrecht</h2>
            <p className="text-gray-300">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. 
              Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen 
              der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}





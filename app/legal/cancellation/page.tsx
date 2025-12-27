export default function CancellationPage() {
  return (
    <div className="min-h-screen py-12 bg-fortnite-darker">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-white mb-8">Widerrufsbelehrung</h1>
        
        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Widerrufsrecht</h2>
            <p className="text-gray-300 mb-4">
              Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.
            </p>
            <p className="text-gray-300 mb-4">
              Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, 
              der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat.
            </p>
            <p className="text-gray-300">
              Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (SimexMafia, Musterstraße 123, 12345 Musterstadt, Deutschland, 
              E-Mail: info@simexmafia.de) mittels einer eindeutigen Erklärung (z.B. ein mit der Post versandter Brief, 
              Telefax oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Widerrufsformular</h2>
            <div className="bg-fortnite-darker border border-purple-500/30 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                Wenn Sie den Vertrag widerrufen möchten, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück an:
              </p>
              <div className="text-gray-300 space-y-1 mb-4">
                <p><strong className="text-white">SimexMafia</strong></p>
                <p>Musterstraße 123</p>
                <p>12345 Musterstadt</p>
                <p>Deutschland</p>
                <p className="mt-2">
                  E-Mail: <a href="mailto:info@simexmafia.de" className="text-purple-400 hover:text-purple-300">info@simexmafia.de</a>
                </p>
              </div>
              <div className="border-t border-purple-500/30 pt-4 mt-4">
                <p className="text-gray-300 mb-2">Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*):</p>
                <p className="text-gray-300 mb-2">Bestellt am (*)/erhalten am (*):</p>
                <p className="text-gray-300 mb-2">Name des/der Verbraucher(s):</p>
                <p className="text-gray-300 mb-2">Anschrift des/der Verbraucher(s):</p>
                <p className="text-gray-300 mb-2">Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier):</p>
                <p className="text-gray-300">Datum:</p>
                <p className="text-gray-400 text-sm mt-4">(*) Unzutreffendes streichen</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Folgen des Widerrufs</h2>
            <p className="text-gray-300 mb-4">
              Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, 
              einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, 
              dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), 
              unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf 
              dieses Vertrags bei uns eingegangen ist.
            </p>
            <p className="text-gray-300">
              Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, 
              es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung 
              Entgelte berechnet.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Ausschluss des Widerrufsrechts</h2>
            <p className="text-gray-300 mb-2">
              Das Widerrufsrecht besteht nicht bei Verträgen:
            </p>
            <ul className="text-gray-300 list-disc list-inside space-y-1 ml-4">
              <li>zur Lieferung von Waren, die nicht vorgefertigt sind und für deren Herstellung eine individuelle Auswahl oder 
                  Bestimmung durch den Verbraucher maßgeblich ist oder die eindeutig auf die persönlichen Bedürfnisse des Verbrauchers zugeschnitten sind</li>
              <li>zur Lieferung von Waren, die schnell verderben können oder deren Verfallsdatum schnell überschritten würde</li>
              <li>zur Lieferung versiegelter Waren, die aus Gründen des Gesundheitsschutzes oder der Hygiene nicht zur Rückgabe geeignet sind, 
                  wenn ihre Versiegelung nach der Lieferung entfernt wurde</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Ende der Widerrufsbelehrung</h2>
            <p className="text-gray-300">
              Bei Fragen zum Widerruf können Sie uns jederzeit kontaktieren:
            </p>
            <div className="text-gray-300 mt-2">
              <p>
                E-Mail: <a href="mailto:info@simexmafia.de" className="text-purple-400 hover:text-purple-300">info@simexmafia.de</a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}







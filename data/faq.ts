export interface FAQ {
  id: string
  category: 'allgemein' | 'bestellung' | 'zahlung' | 'account' | 'produkte' | 'sacks' | 'goofycoins' | 'inventar' | 'versand'
  question: string
  answer: string
  tags: string[]
}

export const faqData: FAQ[] = [
  // Allgemein
  {
    id: '1',
    category: 'allgemein',
    question: 'Was ist SimexMafia?',
    answer: 'SimexMafia ist ein vertrauenswürdiger Marktplatz für digitale Gaming-Produkte. Wir bieten vergünstigte Spiele, Gutscheine, Abonnements und mehr für alle großen Gaming-Plattformen an.',
    tags: ['über uns', 'was ist', 'plattform'],
  },
  {
    id: '2',
    category: 'allgemein',
    question: 'Ist SimexMafia sicher?',
    answer: 'Ja, absolut! Wir verwenden verschlüsselte Zahlungen und arbeiten nur mit verifizierten Verkäufern zusammen. Alle Transaktionen sind sicher und geschützt.',
    tags: ['sicherheit', 'sicher', 'vertrauen'],
  },
  {
    id: '3',
    category: 'allgemein',
    question: 'Wie kann ich den Support kontaktieren?',
    answer: 'Sie können uns über das Kontaktformular erreichen oder eine E-Mail an info@simexmafia.de senden. Unser Support-Team antwortet normalerweise innerhalb von 24 Stunden.',
    tags: ['support', 'kontakt', 'hilfe'],
  },
  
  // Bestellung
  {
    id: '4',
    category: 'bestellung',
    question: 'Wie bestelle ich ein Produkt?',
    answer: 'Wählen Sie einfach das gewünschte Produkt aus, klicken Sie auf "In den Warenkorb" und folgen Sie den Anweisungen im Checkout-Prozess. Sie können mit Kreditkarte, PayPal oder anderen Zahlungsmethoden bezahlen.',
    tags: ['bestellen', 'kaufen', 'warenkorb'],
  },
  {
    id: '5',
    category: 'bestellung',
    question: 'Kann ich eine Bestellung stornieren?',
    answer: 'Ja, Sie können Ihre Bestellung innerhalb von 14 Tagen nach dem Kauf stornieren. Bitte kontaktieren Sie unseren Support für weitere Informationen.',
    tags: ['stornieren', 'rückgängig', 'widerruf'],
  },
  {
    id: '6',
    category: 'bestellung',
    question: 'Wie lange dauert die Bearbeitung einer Bestellung?',
    answer: 'Digitale Produkte werden normalerweise sofort nach erfolgreicher Zahlung bereitgestellt. Bei physischen Produkten beträgt die Bearbeitungszeit 1-3 Werktage.',
    tags: ['bearbeitung', 'dauer', 'zeit'],
  },
  
  // Zahlung
  {
    id: '7',
    category: 'zahlung',
    question: 'Welche Zahlungsmethoden werden akzeptiert?',
    answer: 'Wir akzeptieren Kreditkarten (Visa, Mastercard, American Express), PayPal, Apple Pay und Google Pay. Alle Zahlungen sind sicher und verschlüsselt.',
    tags: ['zahlung', 'kreditkarte', 'paypal'],
  },
  {
    id: '8',
    category: 'zahlung',
    question: 'Ist meine Zahlungsinformation sicher?',
    answer: 'Ja, absolut! Wir verwenden SSL-Verschlüsselung und arbeiten mit führenden Zahlungsanbietern zusammen. Ihre Kreditkartendaten werden niemals auf unseren Servern gespeichert.',
    tags: ['sicherheit', 'verschlüsselung', 'daten'],
  },
  {
    id: '9',
    category: 'zahlung',
    question: 'Kann ich einen Rabattcode verwenden?',
    answer: 'Ja! Sie können Rabattcodes im Checkout eingeben. Gültige Codes werden automatisch angewendet und der Rabatt wird von Ihrem Gesamtbetrag abgezogen.',
    tags: ['rabatt', 'gutschein', 'code'],
  },
  
  // Account
  {
    id: '10',
    category: 'account',
    question: 'Wie erstelle ich ein Konto?',
    answer: 'Klicken Sie auf "Registrieren" in der Navigation, füllen Sie das Formular aus und bestätigen Sie Ihre E-Mail-Adresse. Sie können sich auch mit Google anmelden.',
    tags: ['registrierung', 'konto', 'anmeldung'],
  },
  {
    id: '11',
    category: 'account',
    question: 'Ich habe mein Passwort vergessen. Was soll ich tun?',
    answer: 'Klicken Sie auf "Passwort vergessen" auf der Login-Seite und geben Sie Ihre E-Mail-Adresse ein. Sie erhalten einen Link zum Zurücksetzen Ihres Passworts.',
    tags: ['passwort', 'zurücksetzen', 'vergessen'],
  },
  {
    id: '12',
    category: 'account',
    question: 'Wie kann ich mein Profil bearbeiten?',
    answer: 'Gehen Sie zu Ihrem Konto und klicken Sie auf "Bearbeiten". Dort können Sie Ihre persönlichen Informationen, E-Mail-Adresse und andere Details aktualisieren.',
    tags: ['profil', 'bearbeiten', 'einstellungen'],
  },
  
  // Produkte
  {
    id: '13',
    category: 'produkte',
    question: 'Sind die Produkte original und legitim?',
    answer: 'Ja, alle unsere Produkte sind 100% original und legitim. Wir arbeiten nur mit autorisierten Verkäufern zusammen und garantieren die Authentizität aller Produkte.',
    tags: ['original', 'legitim', 'authentisch'],
  },
  {
    id: '14',
    category: 'produkte',
    question: 'Kann ich ein Produkt zurückgeben?',
    answer: 'Digitale Produkte können in der Regel nicht zurückgegeben werden, da sie sofort nach dem Kauf bereitgestellt werden. Bei Problemen kontaktieren Sie bitte unseren Support.',
    tags: ['rückgabe', 'retour', 'probleme'],
  },
  {
    id: '15',
    category: 'produkte',
    question: 'Wie funktioniert die Wunschliste?',
    answer: 'Sie können Produkte zu Ihrer Wunschliste hinzufügen, indem Sie auf das Herz-Symbol klicken. Ihre Wunschliste finden Sie in der Navigation oder unter /wishlist.',
    tags: ['wunschliste', 'favoriten', 'merken'],
  },
  
  // Säcke
  {
    id: '16',
    category: 'sacks',
    question: 'Was sind Säcke?',
    answer: 'Säcke sind Lootboxen, die Sie öffnen können, um zufällige Belohnungen zu erhalten. Es gibt verschiedene Sack-Typen (Bronze, Silver, Gold, etc.) mit unterschiedlichen Belohnungen.',
    tags: ['säcke', 'lootbox', 'belohnungen'],
  },
  {
    id: '17',
    category: 'sacks',
    question: 'Wie öffne ich einen Sack?',
    answer: 'Gehen Sie zur Sack-Seite, wählen Sie einen Sack aus und klicken Sie auf "Kaufen & Öffnen". Sie können mit GoofyCoins oder Echtgeld bezahlen. Nach dem Kauf wird der Sack automatisch geöffnet.',
    tags: ['öffnen', 'kaufen', 'sack'],
  },
  {
    id: '18',
    category: 'sacks',
    question: 'Was kann ich aus einem Sack gewinnen?',
    answer: 'Sie können Produkte, GoofyCoins oder eine Niete gewinnen. Höhere Sack-Typen haben bessere Chancen auf wertvolle Belohnungen.',
    tags: ['gewinnen', 'belohnungen', 'chancen'],
  },
  
  // GoofyCoins
  {
    id: '19',
    category: 'goofycoins',
    question: 'Was sind GoofyCoins?',
    answer: 'GoofyCoins sind unsere virtuelle Währung, die Sie für Einkäufe verwenden können. Sie erhalten GoofyCoins bei jedem Kauf und können sie auch direkt kaufen.',
    tags: ['goofycoins', 'währung', 'coins'],
  },
  {
    id: '20',
    category: 'goofycoins',
    question: 'Wie erhalte ich GoofyCoins?',
    answer: 'Sie erhalten GoofyCoins automatisch bei jedem Einkauf basierend auf Ihrem Tier. Sie können GoofyCoins auch direkt auf der GoofyCoins-Kaufseite erwerben.',
    tags: ['erhalten', 'verdienen', 'kaufen'],
  },
  {
    id: '21',
    category: 'goofycoins',
    question: 'Was sind Tiers und wie funktionieren sie?',
    answer: 'Tiers sind Belohnungsstufen basierend auf Ihren GoofyCoins. Höhere Tiers bieten bessere Rabatte und mehr GoofyCoins pro Euro. Es gibt Bronze, Silver, Gold, Platinum und Diamond.',
    tags: ['tier', 'rang', 'belohnungen'],
  },
  
  // Inventar
  {
    id: '22',
    category: 'inventar',
    question: 'Was ist mein Inventar?',
    answer: 'Ihr Inventar enthält alle Produkte, die Sie durch Sack-Öffnungen oder Käufe gewonnen haben. Sie können diese Produkte einlösen und erhalten einen Einlösecode.',
    tags: ['inventar', 'gewonnen', 'produkte'],
  },
  {
    id: '23',
    category: 'inventar',
    question: 'Wie löse ich ein Produkt ein?',
    answer: 'Gehen Sie zu Ihrem Inventar, wählen Sie ein Produkt aus und klicken Sie auf "Einlösen". Sie erhalten einen eindeutigen Einlösecode, den Sie verwenden können.',
    tags: ['einlösen', 'code', 'produkt'],
  },
  {
    id: '24',
    category: 'inventar',
    question: 'Kann ich ein eingelöstes Produkt zurückgeben?',
    answer: 'Einmal eingelöste Produkte können nicht zurückgegeben werden. Stellen Sie sicher, dass Sie das richtige Produkt einlösen, bevor Sie den Code verwenden.',
    tags: ['rückgabe', 'eingelöst', 'code'],
  },
  
  // Versand
  {
    id: '25',
    category: 'versand',
    question: 'Wie erhalte ich meine digitalen Produkte?',
    answer: 'Digitale Produkte werden sofort nach erfolgreicher Zahlung per E-Mail oder in Ihrem Konto bereitgestellt. Sie erhalten eine Bestätigungs-E-Mail mit allen Details.',
    tags: ['digital', 'erhalten', 'email'],
  },
  {
    id: '26',
    category: 'versand',
    question: 'Gibt es Versandkosten?',
    answer: 'Nein, digitale Produkte haben keine Versandkosten. Sie werden sofort nach dem Kauf bereitgestellt.',
    tags: ['versandkosten', 'kosten', 'versand'],
  },
]

export const getFAQsByCategory = (category: string): FAQ[] => {
  if (category === 'all') {
    return faqData
  }
  return faqData.filter(faq => faq.category === category)
}

export const searchFAQs = (query: string): FAQ[] => {
  const lowerQuery = query.toLowerCase()
  return faqData.filter(faq => 
    faq.question.toLowerCase().includes(lowerQuery) ||
    faq.answer.toLowerCase().includes(lowerQuery) ||
    faq.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

export const getCategories = (): string[] => {
  return ['all', 'allgemein', 'bestellung', 'zahlung', 'account', 'produkte', 'sacks', 'goofycoins', 'inventar', 'versand']
}

export const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    'all': 'Alle',
    'allgemein': 'Allgemein',
    'bestellung': 'Bestellung',
    'zahlung': 'Zahlung',
    'account': 'Account',
    'produkte': 'Produkte',
    'sacks': 'Säcke',
    'goofycoins': 'GoofyCoins',
    'inventar': 'Inventar',
    'versand': 'Versand',
  }
  return labels[category] || category
}














# Firmendaten einrichten

Diese Anleitung erklärt, wie Sie die Platzhalterdaten durch Ihre echten Firmendaten ersetzen.

## 📋 Übersicht

Alle Firmendaten werden zentral in der Datei `lib/company-info.ts` verwaltet. Nachdem Sie diese Datei ausgefüllt haben, werden die Daten automatisch auf der gesamten Website verwendet.

## 🔧 Schritte

### 1. Öffnen Sie `lib/company-info.ts`

Diese Datei enthält alle Platzhalterdaten, die Sie ersetzen müssen.

### 2. Ersetzen Sie die folgenden Informationen:

#### Firmenname
```typescript
name: 'SimexMafia',
legalName: 'SimexMafia', // Vollständiger rechtlicher Firmenname
```

#### Adresse
```typescript
address: {
  street: 'Musterstraße 123', // Ihre Straße und Hausnummer
  city: 'Musterstadt', // Ihre Stadt
  zipCode: '12345', // Ihre Postleitzahl
  country: 'Deutschland',
},
```

#### Kontaktinformationen
```typescript
contact: {
  email: 'info@simexmafia.de', // Ihre E-Mail-Adresse
  phone: '+49 (0) 123 456789', // Ihre Telefonnummer
  website: 'www.simexmafia.de', // Ihre Domain
},
```

#### Verantwortliche Person (für Impressum)
```typescript
responsiblePerson: {
  name: 'Max Mustermann', // Name der verantwortlichen Person
  address: {
    street: 'Musterstraße 123',
    city: 'Musterstadt',
    zipCode: '12345',
    country: 'Deutschland',
  },
},
```

#### Social Media Links
```typescript
socialMedia: {
  youtube: 'https://youtube.com/@simex', // Ihr YouTube-Kanal
  twitter: 'https://twitter.com/simex', // Ihr Twitter-Profil
  instagram: 'https://instagram.com/simex', // Ihr Instagram-Profil
},
```

#### Geschäftsinformationen (optional)
```typescript
business: {
  taxId: '', // Steuernummer (falls erforderlich)
  vatId: '', // Umsatzsteuer-ID (falls erforderlich)
  registrationNumber: '', // Handelsregisternummer (falls erforderlich)
  registrationCourt: '', // Registergericht (falls erforderlich)
},
```

### 3. Wo werden diese Daten verwendet?

Nach dem Ausfüllen werden die Daten automatisch verwendet in:

- ✅ **Impressum** (`/legal/imprint`) - Firmenadresse, Kontakt, verantwortliche Person
- ✅ **Datenschutzerklärung** (`/legal/privacy`) - Firmenadresse, Kontakt
- ✅ **Footer** - Social Media Links
- ✅ **Structured Data** - Für SEO (wird automatisch generiert)

## ⚠️ Wichtige Hinweise

1. **Rechtliche Anforderungen**: Stellen Sie sicher, dass alle Angaben im Impressum den gesetzlichen Anforderungen entsprechen (insbesondere für Deutschland).

2. **Datenschutz**: Überprüfen Sie die Datenschutzerklärung und passen Sie sie gegebenenfalls an Ihre tatsächliche Datenverarbeitung an.

3. **Social Media**: Wenn Sie keine Social-Media-Profile haben, können Sie die entsprechenden Felder leer lassen oder entfernen. Die Links werden dann nicht angezeigt.

4. **Geschäftsinformationen**: Die Geschäftsinformationen (Steuernummer, etc.) sind optional. Fügen Sie sie nur hinzu, wenn sie für Ihr Unternehmen erforderlich sind.

## 🔍 Überprüfung

Nach dem Ausfüllen sollten Sie folgende Seiten überprüfen:

1. `/legal/imprint` - Impressum
2. `/legal/privacy` - Datenschutzerklärung
3. Footer auf jeder Seite - Social Media Links

## 📝 Weitere Anpassungen

Wenn Sie zusätzliche Informationen hinzufügen möchten (z.B. Geschäftszeiten, weitere Kontaktmöglichkeiten), können Sie diese in `lib/company-info.ts` hinzufügen und dann in den entsprechenden Komponenten verwenden.




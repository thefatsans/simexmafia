# Payment Integration Setup

Diese Anleitung erklärt, wie Sie die Stripe Payment Integration einrichten.

## Stripe Setup

### 1. Stripe Account erstellen

1. Gehen Sie zu [https://stripe.com](https://stripe.com)
2. Erstellen Sie ein Konto (kostenlos)
3. Aktivieren Sie Ihr Konto

### 2. API Keys erhalten

1. Gehen Sie zum [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigieren Sie zu **Developers** > **API keys**
3. Kopieren Sie:
   - **Publishable key** (beginnt mit `pk_test_` für Test-Modus)
   - **Secret key** (beginnt mit `sk_test_` für Test-Modus)

### 3. Environment Variables konfigurieren

Erstellen Sie eine `.env.local` Datei im Root-Verzeichnis (falls noch nicht vorhanden) und fügen Sie hinzu:

```env
# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

**Wichtig:**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` ist öffentlich und kann im Client-Code verwendet werden
- `STRIPE_SECRET_KEY` ist geheim und wird nur auf dem Server verwendet (nie im Client-Code!)

### 4. Test-Kreditkarten

Im Test-Modus können Sie folgende Test-Karten verwenden:

- **Erfolgreiche Zahlung:**
  - Karte: `4242 4242 4242 4242`
  - Ablaufdatum: Beliebige zukünftige Daten (z.B. `12/34`)
  - CVV: Beliebige 3 Ziffern (z.B. `123`)

- **Zahlung erfordert Authentifizierung:**
  - Karte: `4000 0025 0000 3155`
  - Ablaufdatum: Beliebige zukünftige Daten
  - CVV: Beliebige 3 Ziffern

- **Zahlung fehlgeschlagen:**
  - Karte: `4000 0000 0000 0002`
  - Ablaufdatum: Beliebige zukünftige Daten
  - CVV: Beliebige 3 Ziffern

Weitere Test-Karten: [Stripe Test Cards](https://stripe.com/docs/testing)

## Funktionsweise

### Mit Stripe (wenn konfiguriert)

1. Benutzer füllt Rechnungsinformationen aus
2. Beim Absenden wird ein Stripe Payment Intent erstellt
3. Stripe Elements werden angezeigt (sichere Zahlungseingabe)
4. Benutzer gibt Zahlungsdaten ein
5. Zahlung wird von Stripe verarbeitet
6. Bei Erfolg: Bestellung wird erstellt und bestätigt

### Ohne Stripe (Mock Payment)

Falls keine Stripe-Keys konfiguriert sind, wird ein Mock-Payment-System verwendet:
- Simuliert Zahlungsverarbeitung
- 95% Erfolgsrate (für Entwicklung/Testing)
- Keine echten Zahlungen

## API Routes

### `/api/payments/create-intent`

Erstellt einen Stripe Payment Intent.

**Request:**
```json
{
  "amount": 29.99,
  "currency": "eur",
  "metadata": {
    "orderId": "ORD-123",
    "userId": "user-123"
  }
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

### `/api/payments/confirm`

Bestätigt eine Stripe-Zahlung.

**Request:**
```json
{
  "paymentIntentId": "pi_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "paymentIntentId": "pi_xxx",
  "amount": 29.99,
  "status": "succeeded"
}
```

## Produktion

Für Produktion:

1. Wechseln Sie zu **Live Mode** im Stripe Dashboard
2. Erhalten Sie neue Live API Keys
3. Aktualisieren Sie die Environment Variables:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```
4. Stellen Sie sicher, dass die Keys in Ihrer Hosting-Umgebung gesetzt sind

## Sicherheit

- **Niemals** den Secret Key im Client-Code verwenden
- Verwenden Sie immer HTTPS in Produktion
- Implementieren Sie Webhooks für asynchrone Zahlungsbestätigungen (empfohlen)
- Validieren Sie alle Zahlungen auf dem Server

## Weitere Ressourcen

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe React Integration](https://stripe.com/docs/stripe-js/react)
- [Stripe Testing](https://stripe.com/docs/testing)













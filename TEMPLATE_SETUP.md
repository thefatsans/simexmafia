# Template Setup Anleitung

## Empfohlene Templates

### Option 1: Next.js Commerce (Vercel)
**GitHub:** https://github.com/vercel/commerce
- ✅ Professionell und gut dokumentiert
- ✅ TypeScript Support
- ✅ Stripe Integration
- ✅ Modernes Design

### Option 2: Medusa (Full-Stack E-Commerce)
**GitHub:** https://github.com/medusajs/medusa
- ✅ Vollständiges Backend + Frontend
- ✅ Sehr flexibel
- ✅ Viele Payment Provider

### Option 3: Next.js E-Commerce Starter (Einfacher)
**GitHub:** https://github.com/vercel/next.js/tree/canary/examples/with-stripe-typescript
- ✅ Einfacher Einstieg
- ✅ Stripe Integration
- ✅ Minimal aber funktional

## Setup Schritte

### 1. Template klonen

```bash
# Für Next.js Commerce
git clone https://github.com/vercel/commerce.git simexmafia-new
cd simexmafia-new

# Oder für einfaches Template
npx create-next-app@latest simexmafia-new --example with-stripe-typescript
```

### 2. Dependencies installieren

```bash
npm install
# oder
yarn install
```

### 3. Produkte importieren

Die Produktdaten sind in `products-export.json` gespeichert. 

**Option A: Direkt in Code einfügen**
- Erstelle `data/products.ts` oder `lib/products.ts`
- Importiere die JSON-Datei oder kopiere die Daten

**Option B: In Datenbank importieren**
- Falls das Template eine Datenbank verwendet (z.B. Prisma)
- Erstelle ein Seed-Script, das die JSON-Datei liest und in die DB importiert

### 4. Produktstruktur anpassen

Die Produkte haben folgende Struktur:
```typescript
{
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  discount?: number
  image: string
  category: string
  platform: string
  seller: {
    id: string
    name: string
    rating: number
    reviewCount: number
    verified: boolean
  }
  rating: number
  reviewCount: number
  inStock: boolean
  tags: string[]
}
```

### 5. Kategorien

- `games` - Spiele
- `gift-cards` - Gutscheine
- `subscriptions` - Abonnements
- `dlc` - DLCs
- `in-game-currency` - In-Game-Währung

### 6. Plattformen

- Steam
- PlayStation
- Xbox
- Nintendo
- Epic Games
- Origin
- Battle.net
- Other

## Nächste Schritte

1. Template auswählen und klonen
2. Produkte importieren (siehe `products-export.json`)
3. Design anpassen (SimexMafia Branding)
4. Payment Integration (PayPal, wie vorher)
5. Admin Panel für Bestellungen einrichten

## Hilfe

Falls du Hilfe beim Setup brauchst, sag Bescheid! Ich kann dir bei:
- Template-Auswahl helfen
- Produktimport unterstützen
- Code-Anpassungen machen
- Features hinzufügen






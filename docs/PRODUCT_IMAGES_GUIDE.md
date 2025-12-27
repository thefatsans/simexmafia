# Produktbilder Guide

## Aktueller Status

Die Website verwendet jetzt ein intelligentes Bildsystem, das automatisch passende Bilder für Produkte zuweist:

1. **Custom Images** (`prisma/product-images.ts`): Spezifische Bilder für bekannte Produkte
2. **Image Helper** (`prisma/image-helper.ts`): Intelligente Fallback-Bilder basierend auf Kategorie, Plattform und Name
3. **Automatische Updates**: Scripts aktualisieren Produktbilder in der Datenbank

## Wie funktioniert es?

### 1. Custom Images (Höchste Priorität)
Die Datei `prisma/product-images.ts` enthält spezifische Bild-URLs für bekannte Produkte. Diese werden zuerst geprüft.

### 2. Image Helper (Fallback)
Wenn keine Custom Image gefunden wird, verwendet `getProductImage()` intelligente Fallbacks basierend auf:
- Produktkategorie (Games, Gift Cards, Subscriptions, etc.)
- Plattform (Steam, PlayStation, Xbox, etc.)
- Produktname

### 3. Bildquellen

**Für Spiele:**
- Steam Grid DB CDN: `https://cdn2.steamgriddb.com/file/sgdb-cdn/grid/...`
- PlayStation Store API: `https://image.api.playstation.com/...`
- Microsoft Store: `https://store-images.s-microsoft.com/...`
- Nintendo Assets: `https://assets.nintendo.com/...`

**Für Gift Cards:**
- Offizielle Plattform-Bilder
- Steam CDN für Steam Wallet Codes

**Für Subscriptions:**
- Plattform-spezifische Bilder
- Service-spezifische Bilder (Spotify, Netflix, etc.)

## Produktbilder hinzufügen

### Option 1: Manuell in product-images.ts

Öffne `prisma/product-images.ts` und füge deine Bild-URLs hinzu:

```typescript
export const productImageMap: Record<string, string> = {
  'Produktname': 'https://deine-bild-url.com/bild.jpg',
  // ...
}
```

### Option 2: Script verwenden

Führe das Update-Script aus, um alle Produktbilder zu aktualisieren:

```bash
npm run db:update-all-images
```

## Empfohlene Bildquellen

### Für Steam Games
- **Steam Grid DB**: https://www.steamgriddb.com/
- **Steam CDN**: `https://cdn.cloudflare.steamstatic.com/steam/apps/{APP_ID}/header.jpg`

### Für PlayStation Games
- **PlayStation Store API**: Offizielle API-Bilder
- Format: `https://image.api.playstation.com/vulcan/ap/rnd/...`

### Für Xbox Games
- **Microsoft Store**: `https://store-images.s-microsoft.com/image/apps.{ID}...`

### Für Nintendo Games
- **Nintendo Assets**: `https://assets.nintendo.com/image/upload/...`

### Für Gift Cards
- Offizielle Plattform-Websites
- Store-Bilder von den jeweiligen Plattformen

## Nächste Schritte

Um wirklich spezifische Bilder für jedes Produkt zu haben, kannst du:

1. **Bilder manuell hinzufügen**: Füge die URLs in `product-images.ts` hinzu
2. **API Integration**: Integriere Steam Grid DB API oder IGDB API für automatische Bildsuche
3. **Eigene Bilder hochladen**: Erstelle einen Image Upload Service

## Aktuelle Abdeckung

- ✅ V-Bucks: Offizielle Microsoft Store Bilder
- ✅ Bekannte Spiele: Steam Grid DB / Plattform-APIs
- ✅ Gift Cards: Plattform-spezifische Bilder
- ⚠️ Viele Produkte: Verwenden noch generische Fallback-Bilder

Um die Abdeckung zu verbessern, füge mehr spezifische Bilder in `product-images.ts` hinzu.





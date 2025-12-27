# Produktbilder Setup

## Aktueller Status

Die Website verwendet aktuell generische Unsplash-Bilder für Produkte. Für eine professionelle Präsentation sollten produkt-spezifische Bilder verwendet werden.

## Optionen für produkt-spezifische Bilder

### Option 1: Eigene Bilder hochladen (Empfohlen)

1. **Bilder vorbereiten:**
   - Für jedes Produkt ein passendes Bild (z.B. V-Bucks Bild für Fortnite V-Bucks)
   - Empfohlene Größe: 800x600px oder 16:9 Format
   - Format: JPG oder PNG

2. **Bilder speichern:**
   - Erstelle einen Ordner: `public/images/products/`
   - Benenne die Bilder nach Produkt-ID: `{productId}.jpg`
   - Beispiel: `public/images/products/1.jpg` für Fortnite V-Bucks 1000

3. **Image Helper aktualisieren:**
   ```typescript
   // In prisma/image-helper.ts
   export function getProductImage(category: string, platform: string, name: string, productId?: string): string {
     // Wenn eigenes Bild existiert, verwende es
     if (productId) {
       return `/images/products/${productId}.jpg`
     }
     // Fallback zu generischen Bildern
     // ...
   }
   ```

### Option 2: Cloudinary oder ähnlicher Service

1. **Cloudinary Setup:**
   - Account erstellen bei cloudinary.com
   - Bilder hochladen
   - API-Keys in `.env.local` speichern

2. **Next.js Image Optimization:**
   - Cloudinary in `next.config.js` konfigurieren
   - Bilder über Cloudinary CDN laden

### Option 3: Externe Bildquellen

- **Steam Grid DB** für Steam-Spiele
- **IGDB API** für Spiel-Cover
- **Offizielle Produktbilder** von Herstellern

## Empfohlene Bildquellen für verschiedene Produkte

### Fortnite V-Bucks
- Offizielle Epic Games Bilder
- Oder eigene Screenshots vom Spiel

### Steam Games
- Steam Store Screenshots
- Steam Grid DB

### Gift Cards
- Offizielle Plattform-Bilder (PlayStation, Xbox, etc.)

### In-Game Currency
- Offizielle Bilder der Spiele-Entwickler

## Nächste Schritte

1. **Kurzfristig:** Aktuelle Lösung mit verbesserten generischen Bildern verwenden
2. **Mittelfristig:** Image Upload Feature implementieren
3. **Langfristig:** Cloudinary oder ähnlichen Service integrieren

## Aktuelle Bild-Zuordnung

Die `prisma/image-helper.ts` Funktion weist bereits unterschiedliche Bilder basierend auf:
- Produktname (z.B. "Fortnite V-Bucks" → spezifisches Bild)
- Kategorie (Games, Gift Cards, etc.)
- Plattform (Steam, PlayStation, etc.)

zu. Dies ist besser als vorher, aber für echte produkt-spezifische Bilder müssen eigene Bilder hochgeladen werden.





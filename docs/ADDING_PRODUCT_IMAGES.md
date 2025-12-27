# Produktbilder hinzufügen

## Wie füge ich eigene Produktbilder hinzu?

### Option 1: Bild-URLs direkt hinzufügen (Einfachste Methode)

1. Öffne die Datei `prisma/product-images.ts`
2. Füge deine Bild-URLs in das `productImageMap` Objekt ein:

```typescript
export const productImageMap: Record<string, string> = {
  // Fortnite V-Bucks
  'Fortnite V-Bucks 500': 'https://deine-bild-url.com/vbucks-500.jpg',
  'Fortnite V-Bucks 1000': 'https://deine-bild-url.com/vbucks-1000.jpg',
  'Fortnite V-Bucks 1350': 'https://deine-bild-url.com/vbucks-1350.jpg',
  
  // Steam Games
  'Counter-Strike 2': 'https://deine-bild-url.com/cs2.jpg',
  'Grand Theft Auto V': 'https://deine-bild-url.com/gta5.jpg',
  
  // Gift Cards
  'Steam Wallet Code €10': 'https://deine-bild-url.com/steam-10.jpg',
  'PlayStation Store Gift Card €50': 'https://deine-bild-url.com/ps-50.jpg',
  
  // Weitere Produkte...
}
```

3. Die Funktion `getProductImage` verwendet automatisch deine URLs, wenn sie vorhanden sind
4. Falls keine URL gefunden wird, wird ein generisches Bild verwendet

### Option 2: Nach Produkt-ID

Du kannst auch die Produkt-ID verwenden:

```typescript
export const productImageMap: Record<string, string> = {
  'prod_abc123': 'https://deine-bild-url.com/produkt-1.jpg',
  'prod_xyz789': 'https://deine-bild-url.com/produkt-2.jpg',
}
```

### Option 3: Teilweise Übereinstimmung

Die Funktion sucht auch nach teilweisen Übereinstimmungen. Wenn du z.B. `'V-Bucks'` als Key verwendest, wird es für alle V-Bucks Produkte verwendet:

```typescript
export const productImageMap: Record<string, string> = {
  'V-Bucks': 'https://deine-bild-url.com/vbucks-generic.jpg', // Wird für alle V-Bucks verwendet
  'Steam': 'https://deine-bild-url.com/steam-generic.jpg', // Wird für alle Steam Produkte verwendet
}
```

## Bild-URLs Format

- **HTTP/HTTPS URLs**: `https://example.com/image.jpg`
- **CDN URLs**: `https://cdn.example.com/images/product.jpg`
- **Cloudinary**: `https://res.cloudinary.com/your-cloud/image/upload/product.jpg`
- **Lokale Bilder**: `/images/products/product.jpg` (müssen in `public/images/products/` sein)

## Beispiel: Alle V-Bucks Bilder hinzufügen

```typescript
export const productImageMap: Record<string, string> = {
  'Fortnite V-Bucks 500': 'https://cdn.example.com/vbucks/500.jpg',
  'Fortnite V-Bucks 1,000': 'https://cdn.example.com/vbucks/1000.jpg',
  'Fortnite V-Bucks 1,350': 'https://cdn.example.com/vbucks/1350.jpg',
  'Fortnite V-Bucks 2,800': 'https://cdn.example.com/vbucks/2800.jpg',
  'Fortnite V-Bucks 5,000': 'https://cdn.example.com/vbucks/5000.jpg',
  'Fortnite V-Bucks 10,000': 'https://cdn.example.com/vbucks/10000.jpg',
  'Fortnite V-Bucks 13,500': 'https://cdn.example.com/vbucks/13500.jpg',
}
```

## Nach dem Hinzufügen

1. Speichere die Datei `prisma/product-images.ts`
2. Die Änderungen werden automatisch beim nächsten Seed oder Server-Neustart verwendet
3. Falls du die Datenbank neu seeden möchtest: `npm run db:seed`

## Tipps

- Verwende konsistente Bildgrößen (z.B. 800x600px)
- Stelle sicher, dass die URLs öffentlich zugänglich sind
- Verwende HTTPS-URLs für Sicherheit
- Teste die URLs in einem Browser, bevor du sie hinzufügst





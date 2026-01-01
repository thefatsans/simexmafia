# Neujahrs-Sale Banner Setup

## Bild hochladen

1. Benenne dein Neujahrs-Sale-Banner-Bild um zu: `newyear-sale-banner.png`
2. Speichere es im `public`-Ordner (gleicher Ordner wie `logo.png`)
3. Das Banner wird automatisch auf der Homepage angezeigt

## Banner-Funktionen

- **Schließbar**: Benutzer können das Banner mit dem X-Button schließen
- **Gespeichert**: Einmal geschlossen, wird es nicht mehr angezeigt (gespeichert in localStorage)
- **Responsive**: Passt sich automatisch an Mobile und Desktop an
- **Klickbar**: Führt zu `/products?sale=newyear` (kannst du anpassen)

## Banner anpassen

Das Banner kann in `components/NewYearSaleBanner.tsx` angepasst werden:
- Link ändern: `href="/products?sale=newyear"`
- Styling anpassen
- Verhalten ändern

## Banner entfernen

Um das Banner zu entfernen, lösche einfach:
- `components/NewYearSaleBanner.tsx`
- Den Import und die Verwendung in `app/page.tsx`









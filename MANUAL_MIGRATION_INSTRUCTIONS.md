# Manuelle Migration - Anleitung

Da die automatische Prisma-Migration aufgrund von Verbindungsproblemen nicht funktioniert, kannst du die Datenbank manuell über den Supabase SQL Editor einrichten.

## Schritt 1: Supabase SQL Editor öffnen

1. Gehe zu deinem Supabase Dashboard: https://supabase.com/dashboard
2. Wähle dein Projekt aus
3. Klicke auf **SQL Editor** im linken Menü

## Schritt 2: SQL ausführen

1. Öffne die Datei `prisma/manual-migration.sql`
2. Kopiere den gesamten Inhalt
3. Füge ihn in den SQL Editor ein
4. Klicke auf **Run** (oder drücke `Ctrl+Enter`)

## Schritt 3: Prisma Migration Status aktualisieren

Nach erfolgreicher Ausführung der SQL-Befehle, markiere die Migration als abgeschlossen:

```bash
# Erstelle das Migrations-Verzeichnis
mkdir -p prisma/migrations/$(Get-Date -Format "yyyyMMddHHmmss")_init

# Erstelle eine leere migration.sql Datei
echo "-- Migration applied manually via Supabase SQL Editor" > prisma/migrations/$(Get-Date -Format "yyyyMMddHHmmss")_init/migration.sql
```

Oder einfacher: Führe diesen Befehl aus:
```bash
npx prisma migrate resolve --applied init
```

## Schritt 4: Prisma Client neu generieren

```bash
npx prisma generate
```

## Schritt 5: Verbindung testen

Nach der Migration sollte die Verbindung funktionieren. Teste es:

```bash
npx prisma studio
```

Dies öffnet Prisma Studio, wo du die Datenbank-Tabellen sehen und verwalten kannst.

## Alternative: Migration Status zurücksetzen

Falls du die Migrationen später automatisch ausführen möchtest:

```bash
npx prisma migrate reset
npx prisma migrate dev --name init
```

## Wichtige Hinweise

- **Backup**: Erstelle vor der Migration ein Backup deiner Datenbank (falls bereits Daten vorhanden sind)
- **Fehlerbehebung**: Falls Fehler auftreten, prüfe die Fehlermeldungen im SQL Editor
- **Tabellen prüfen**: Nach der Migration kannst du die Tabellen im Supabase Dashboard unter **Table Editor** sehen






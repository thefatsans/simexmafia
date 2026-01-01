# Status Reason Migration - WICHTIG!

## Problem
Der Grund für "Fehlgeschlagen" oder "Storniert" wird nicht gespeichert/angezeigt, weil die `statusReason` Spalte in der Datenbank fehlt.

## Lösung
Führe die vollständige SQL-Migration in Supabase aus:

**Datei:** `prisma/complete-migration.sql`

Diese Migration enthält:
- Alle Tabellen (falls noch nicht vorhanden)
- Die `key` Spalte für `OrderItem`
- Die `statusReason` Spalte für `Order`
- Alle Indizes für bessere Performance

## Anleitung für Supabase:

1. Gehe zu deinem Supabase Dashboard
2. Klicke auf "SQL Editor" im linken Menü
3. Füge die SQL-Migration oben ein
4. Klicke auf "Run" oder drücke Ctrl+Enter
5. Warte auf die Bestätigung "Success"

## Nach der Migration:

1. Seite neu laden (F5)
2. Im Admin-Panel einen Grund eingeben und speichern
3. In der Bestellhistorie sollte der Grund jetzt angezeigt werden

## Debugging:

Falls es immer noch nicht funktioniert:
1. Öffne die Browser-Konsole (F12)
2. Suche nach `[Orders API]` Logs
3. Prüfe ob `statusReason` in den Logs erscheint
4. Prüfe ob Fehler wie "Unknown column" oder "statusReason" erscheinen


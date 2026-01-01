# Supabase Datenbank Setup

## Connection String finden

1. Gehe zu: https://supabase.com/dashboard/project/bvsebymssjcazguyukdi/settings/database
2. Scrolle zu "Connection string"
3. Wähle "URI" (nicht "Session mode" oder "Transaction mode")
4. Kopiere den vollständigen String

## Wichtige Hinweise

### Für Migrationen (Prisma Migrate)
- Verwende den **"Direct connection"** String
- Oder den normalen URI-String

### Für Production (Next.js App)
- Verwende **"Connection pooling"** String (für bessere Performance)
- Beginnt mit `postgresql://postgres.xxxxx@...` (mit `.` nach postgres)

## Aktuelle Konfiguration

Die DATABASE_URL in `.env.local` sollte so aussehen:

```env
DATABASE_URL="postgresql://postgres:akzHhZF2nw5avAys@db.bvsebymssjcazguyukdi.supabase.co:5432/postgres"
```

## Troubleshooting

### "Can't reach database server"
1. Prüfe, ob das Supabase-Projekt vollständig erstellt ist (1-2 Minuten warten)
2. Prüfe, ob die Datenbank aktiv ist (grüner Status im Dashboard)
3. Versuche den "Direct connection" String zu verwenden

### "Password authentication failed"
- Stelle sicher, dass das Passwort korrekt ist
- Prüfe, ob Sonderzeichen im Passwort richtig escaped sind

### "Connection timeout"
- Prüfe deine Firewall-Einstellungen
- Stelle sicher, dass Port 5432 nicht blockiert ist













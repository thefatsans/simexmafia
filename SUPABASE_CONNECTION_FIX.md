# Supabase Verbindungsproblem beheben

## Problem
Die DNS-Auflösung schlägt fehl: `Name resolution of db.bvsebymssjcazguyukdi.supabase.co failed`

## Lösung

### 1. Korrekten Connection String aus Supabase holen

1. Gehe zu deinem Supabase Dashboard: https://supabase.com/dashboard
2. Wähle dein Projekt aus
3. Gehe zu **Settings** → **Database**
4. Scrolle zu **Connection string**
5. Wähle **URI** aus
6. Kopiere den **Connection string** (nicht den Pooler!)

Der Connection String sollte so aussehen:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
```

ODER für direkte Verbindung:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
```

### 2. Connection String in .env.local aktualisieren

Ersetze die aktuelle `DATABASE_URL` in `.env.local` mit dem korrekten Connection String aus Supabase.

### 3. Alternative: Connection Pooler verwenden

Supabase empfiehlt den Connection Pooler für bessere Performance:

```
postgresql://postgres.bvsebymssjcazguyukdi:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
```

**Wichtig:** 
- Port `6543` für Pooler (nicht `5432`)
- Hostname: `aws-0-eu-central-1.pooler.supabase.com` (nicht `db.bvsebymssjcazguyukdi.supabase.co`)
- User: `postgres.bvsebymssjcazguyukdi` (nicht nur `postgres`)

### 4. Server neu starten

Nach der Aktualisierung:
```bash
npm run dev
```

## Prüfen

Nach dem Neustart solltest du in den Server-Logs sehen:
- `[Prisma] Database connection established` (statt Fehler)

## Falls es immer noch nicht funktioniert

1. **Prüfe die Supabase Firewall:**
   - Settings → Database → Network Restrictions
   - Stelle sicher, dass "Allow connections from anywhere" aktiviert ist (für Entwicklung)

2. **Teste die Verbindung mit einem SQL-Client:**
   - Verwende DBeaver, pgAdmin oder einen anderen PostgreSQL-Client
   - Wenn das auch nicht funktioniert, ist es ein Netzwerkproblem

3. **Prüfe den Projekt-Status in Supabase:**
   - Stelle sicher, dass das Projekt nicht pausiert ist
   - Prüfe, ob die Datenbank aktiv ist






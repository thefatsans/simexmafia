# Connection String in Supabase finden

## Wo ist der Connection String?

Du bist gerade auf: **Database → Settings**

Der Connection String ist **NICHT** auf dieser Seite. Du musst zu einer anderen Seite:

## Schritt-für-Schritt Anleitung:

### Option 1: Über "Connection Info" (Empfohlen)

1. **Gehe zurück** zur Hauptansicht (klicke auf "Database" in der linken Seitenleiste)
2. Oder gehe direkt zu: **Project Settings → Database** (Zahnrad-Symbol unten links → Database)
3. Scrolle nach unten zu **"Connection Info"** oder **"Connection string"**
4. Du siehst mehrere Tabs:
   - **"URI"** - Direkte Verbindung
   - **"Connection Pooling"** - Pooler Verbindung (empfohlen für dein Problem)
5. Klicke auf **"Connection Pooling"** Tab
6. Du siehst einen String wie:
   ```
   postgresql://postgres.bvsebymssjcazguyukdi:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
7. Klicke auf das **Kopier-Symbol** (📋) neben dem String
8. **WICHTIG**: Ersetze `[YOUR-PASSWORD]` mit deinem Passwort: `gNpIQDgC3em18YNh`
9. Füge am Ende `?sslmode=require` hinzu (falls nicht schon da)

### Option 2: Über "Connection Pooling" in Settings

1. Bleibe auf der aktuellen Seite: **Database → Settings**
2. Scrolle zu **"Connection pooling"** (das siehst du schon)
3. Oben rechts oder in der Nähe sollte ein Link sein: **"Connection string"** oder **"View connection string"**
4. Klicke darauf
5. Kopiere den String

### Option 3: Direkt über URL

1. Gehe zu dieser URL (ersetze `bvsebymssjcazguyukdi` mit deiner Projekt-Referenz):
   ```
   https://supabase.com/dashboard/project/bvsebymssjcazguyukdi/settings/database
   ```
2. Scrolle nach unten zu **"Connection string"**
3. Wähle den Tab **"Connection Pooling"**
4. Kopiere den String

## Was du kopieren solltest:

**Connection Pooling String** (empfohlen, da IPv4 verwendet):
```
postgresql://postgres.bvsebymssjcazguyukdi:gNpIQDgC3em18YNh@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
```

**ODER** Direkte Verbindung (falls Pooler nicht funktioniert):
```
postgresql://postgres:gNpIQDgC3em18YNh@db.bvsebymssjcazguyukdi.supabase.co:5432/postgres?sslmode=require
```

## Nach dem Kopieren:

1. Öffne `.env.local` in deinem Projekt
2. Ersetze die `DATABASE_URL=` Zeile mit dem kopierten String
3. Stelle sicher, dass das Passwort korrekt ist: `gNpIQDgC3em18YNh`
4. Stelle sicher, dass `?sslmode=require` am Ende steht
5. Speichere die Datei
6. Starte den Server neu: `npm run dev`

## Falls du den Connection String nicht findest:

1. Gehe zu: **Project Settings** (Zahnrad unten links)
2. Klicke auf **"Database"** im linken Menü
3. Scrolle ganz nach unten
4. Suche nach **"Connection string"** oder **"Connection Info"**
5. Es sollte mehrere Tabs geben: "URI", "JDBC", "Connection Pooling", etc.





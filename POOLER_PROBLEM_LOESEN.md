# Pooler "Tenant or user not found" Problem lösen

## Problem
Der Connection String funktioniert (Server ist erreichbar), aber es kommt der Fehler:
```
Tenant or user not found (XX000)
```

## Mögliche Ursachen:
1. Connection Pooling ist nicht aktiviert für dein Projekt
2. Der Username-Format ist falsch
3. Der Pooler ist nicht richtig konfiguriert

## Lösung 1: Connection Pooling aktivieren

1. Gehe zu: **Database → Settings** (wo du gerade warst)
2. Scrolle zu **"Connection pooling"**
3. Prüfe ob **"PG Bouncer"** aktiviert ist
4. Falls nicht, aktiviere es
5. Speichere die Einstellungen

## Lösung 2: Direkte Verbindung verwenden (Alternative)

Falls der Pooler nicht funktioniert, verwende die direkte Verbindung. Aber wir müssen das IPv6-Problem lösen.

### Option A: IPv4-Adresse direkt verwenden

1. Gehe zu: **Project Settings → Database**
2. Kopiere den **"URI"** Connection String (nicht Pooler)
3. Der String sollte sein:
   ```
   postgresql://postgres:gNpIQDgC3em18YNh@db.bvsebymssjcazguyukdi.supabase.co:5432/postgres
   ```
4. Füge `?sslmode=require` hinzu

### Option B: Prisma-Konfiguration anpassen

Wir können die Prisma-Konfiguration so anpassen, dass sie IPv4 bevorzugt oder die DNS-Auflösung anders handhabt.

## Lösung 3: Connection String Format prüfen

Manchmal gibt Supabase den Connection String in einem anderen Format. Prüfe:

1. Gehe zu: **Project Settings → Database**
2. Scrolle zu **"Connection string"**
3. Klicke auf **"Connection Pooling"** Tab
4. Prüfe ob der Username wirklich `postgres.bvsebymssjcazguyukdi` ist
5. Manchmal ist es nur `postgres` mit einem anderen Format

## Nächste Schritte:

1. **Prüfe zuerst**: Ist Connection Pooling aktiviert? (Database → Settings → Connection pooling)
2. **Falls aktiviert**: Kopiere den Connection String nochmal direkt aus Supabase
3. **Falls nicht aktiviert**: Aktiviere es oder verwende die direkte Verbindung





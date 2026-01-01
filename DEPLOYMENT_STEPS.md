# 🚀 Deployment-Anleitung - Schritt für Schritt

## Option 1: Vercel (Empfohlen - Am einfachsten für Next.js)

### Schritt 1: GitHub Repository erstellen

1. Gehe zu [GitHub.com](https://github.com) und erstelle einen Account (falls noch nicht vorhanden)
2. Klicke auf "New Repository"
3. Name: `simexmafia-website`
4. Wähle "Private" (oder "Public" wenn du willst)
5. Klicke "Create repository"

### Schritt 2: Code zu GitHub pushen

```bash
# Initialisiere Git (falls noch nicht geschehen)
git init

# Füge alle Dateien hinzu
git add .

# Erstelle ersten Commit
git commit -m "Initial commit - Ready for deployment"

# Füge GitHub Repository hinzu (ersetze USERNAME mit deinem GitHub-Username)
git remote add origin https://github.com/USERNAME/simexmafia-website.git

# Pushe zu GitHub
git branch -M main
git push -u origin main
```

### Schritt 3: Vercel Account erstellen

1. Gehe zu [vercel.com](https://vercel.com)
2. Klicke "Sign Up"
3. Wähle "Continue with GitHub"
4. Autorisiere Vercel

### Schritt 4: Projekt auf Vercel deployen

1. Klicke auf "Add New Project"
2. Wähle dein GitHub Repository (`simexmafia-website`)
3. Vercel erkennt automatisch Next.js
4. Klicke "Deploy"

### Schritt 5: Environment Variables setzen (Optional)

Nach dem ersten Deploy:
1. Gehe zu Project Settings → Environment Variables
2. Füge hinzu:
   - `NEXT_PUBLIC_SITE_URL` = `https://deine-domain.vercel.app` (oder deine Custom Domain)
   - `DATABASE_URL` = (falls du eine Datenbank verwendest)
   - `STRIPE_SECRET_KEY` = (falls du Stripe verwendest)
   - `RESEND_API_KEY` = (falls du E-Mails senden willst)

### Schritt 6: Custom Domain hinzufügen (Optional)

1. Gehe zu Project Settings → Domains
2. Füge deine Domain hinzu (z.B. `simexmafia.com`)
3. Folge den DNS-Anweisungen

---

## Option 2: Netlify

### Schritt 1: GitHub Repository (wie oben)

### Schritt 2: Netlify Account

1. Gehe zu [netlify.com](https://netlify.com)
2. Klicke "Sign up" → "GitHub"
3. Autorisiere Netlify

### Schritt 3: Deploy

1. Klicke "Add new site" → "Import an existing project"
2. Wähle GitHub → dein Repository
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Klicke "Deploy site"

---

## Option 3: Self-Hosting (VPS/Server)

### Voraussetzungen:
- Node.js 18+ installiert
- PM2 für Process Management (optional)

### Schritte:

```bash
# 1. Code auf Server kopieren (via Git oder FTP)
git clone https://github.com/USERNAME/simexmafia-website.git
cd simexmafia-website

# 2. Dependencies installieren
npm install

# 3. Production Build erstellen
npm run build

# 4. Server starten
npm start

# Oder mit PM2 (empfohlen):
npm install -g pm2
pm2 start npm --name "simexmafia" -- start
pm2 save
pm2 startup
```

---

## Wichtige Hinweise

### ✅ Vor dem Deploy prüfen:

1. **`.env` Dateien nicht committen** (sind bereits in `.gitignore`)
2. **Environment Variables auf Vercel/Netlify setzen**
3. **Build funktioniert lokal**: `npm run build` sollte ohne Fehler laufen ✅ (bereits getestet!)

### 🔒 Security:

- Niemals Secrets/API-Keys in den Code committen
- Alle Secrets als Environment Variables setzen

### 📊 Nach dem Deploy:

1. Teste die Live-URL
2. Prüfe, ob alle Features funktionieren
3. Setze Analytics (optional)
4. Prüfe Performance

---

## Schnellstart (Vercel - 5 Minuten)

1. **GitHub Repository erstellen** → Code pushen
2. **Vercel.com** → Sign Up mit GitHub
3. **"Add New Project"** → Repository auswählen
4. **"Deploy"** klicken
5. **Fertig!** 🎉

Die URL ist dann: `https://simexmafia-website.vercel.app`

---

## Hilfe bei Problemen

- **Build-Fehler**: Prüfe die Build-Logs auf Vercel/Netlify
- **Environment Variables**: Stelle sicher, dass alle gesetzt sind
- **Domain-Probleme**: Prüfe DNS-Einstellungen

Viel Erfolg! 🚀









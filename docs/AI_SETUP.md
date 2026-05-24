# KI-Chat Setup Anleitung

Der Chat unterstützt mehrere kostenlose und kostenpflichtige KI-Anbieter. Hier ist eine Anleitung, wie du einen kostenlosen API-Key erhältst.

## 🆓 Kostenlose Optionen

### Option 1: Groq (EMPFOHLEN - Sehr schnell & kostenlos!)

**Warum Groq?**
- ✅ Komplett kostenlos
- ✅ Sehr schnell (unter 1 Sekunde Antwortzeit)
- ✅ Einfache Integration
- ✅ Gute Qualität

**So erhältst du einen Groq API-Key:**

1. Gehe zu https://console.groq.com/
2. Klicke auf "Sign Up" oder "Log In"
3. Erstelle einen Account (E-Mail oder Google)
4. Nach dem Login, gehe zu: https://console.groq.com/keys
5. Klicke auf "Create API Key"
6. Gib einen Namen ein (z.B. "SimexMafia Chat")
7. Kopiere den API-Key (beginnt mit `gsk_`)

**In `.env.local` einfügen:**
```env
NEXT_PUBLIC_GROQ_API_KEY=gsk_dein-kopierter-key-hier
```

**Limits:**
- 30 Requests pro Minute (kostenlos)
- Sehr schnell, perfekt für Chat

---

### Option 2: Hugging Face (Kostenlos, aber langsamer)

**So erhältst du einen Hugging Face Token:**

1. Gehe zu https://huggingface.co/
2. Erstelle einen kostenlosen Account
3. Gehe zu: https://huggingface.co/settings/tokens
4. Klicke auf "New token"
5. Gib einen Namen ein und wähle "Read" Berechtigung
6. Kopiere den Token (beginnt mit `hf_`)

**In `.env.local` einfügen:**
```env
NEXT_PUBLIC_HUGGINGFACE_API_KEY=hf_dein-kopierter-token-hier
```

**Limits:**
- Kostenlos, aber langsamer als Groq
- Gute Qualität

---

## 💰 Kostenpflichtige Optionen

### Option 3: OpenAI (Sehr gut, aber kostenpflichtig)

**So erhältst du einen OpenAI API-Key:**

1. Gehe zu https://platform.openai.com/
2. Erstelle einen Account
3. Gehe zu: https://platform.openai.com/api-keys
4. Klicke auf "Create new secret key"
5. Kopiere den Key (beginnt mit `sk-`)
6. Füge Guthaben hinzu: https://platform.openai.com/account/billing

**In `.env.local` einfügen:**
```env
NEXT_PUBLIC_OPENAI_API_KEY=sk-dein-kopierter-key-hier
NEXT_PUBLIC_AI_MODEL=gpt-3.5-turbo
```

**Kosten:**
- GPT-3.5-turbo: ~$0.0015 pro 1K Tokens
- Sehr günstig für Chat-Anwendungen

---

## 🚀 Setup

1. Erstelle eine `.env.local` Datei im Root-Verzeichnis:
```bash
touch .env.local
```

2. Füge einen der API-Keys hinzu (empfohlen: Groq)

3. Starte den Development-Server neu:
```bash
npm run dev
```

4. Der Chat verwendet automatisch den ersten verfügbaren API-Key

---

## 🔄 Fallback

Wenn kein API-Key vorhanden ist, verwendet der Chat automatisch einen verbesserten regelbasierten Fallback, der:
- ✅ Alle Website-Daten nutzt (FAQ, Produkte, etc.)
- ✅ Intelligente Antworten gibt
- ✅ Komplett kostenlos ist
- ⚠️ Aber weniger flexibel als echte KI

---

## 📊 Vergleich

| Anbieter | Kosten | Geschwindigkeit | Qualität | Limits |
|----------|--------|-----------------|----------|--------|
| **Groq** | 🆓 Kostenlos | ⚡ Sehr schnell | ⭐⭐⭐⭐ | 30 req/min |
| Hugging Face | 🆓 Kostenlos | 🐌 Langsam | ⭐⭐⭐ | Variabel |
| OpenAI | 💰 Bezahlt | ⚡ Schnell | ⭐⭐⭐⭐⭐ | Nach Guthaben |
| Fallback | 🆓 Kostenlos | ⚡ Sofort | ⭐⭐⭐ | Keine |

---

## 💡 Empfehlung

**Für den Start:** Nutze **Groq** - es ist kostenlos, schnell und einfach zu setup!

1. Gehe zu https://console.groq.com/
2. Erstelle Account
3. Hole API-Key
4. Füge in `.env.local` ein
5. Fertig! 🎉















import { faqData } from '@/data/faq'
import { getProductsFromAPI } from '@/lib/api/products'
import { Product } from '@/types'

export interface ChatContext {
  faqs: typeof faqData
  products: Product[]
  productCount: number
  categories: string[]
  platforms: string[]
  priceRange: { min: number; max: number }
}

/**
 * Sammelt alle Website-Informationen für den KI-Kontext
 */
export async function getWebsiteContext(): Promise<ChatContext> {
  const products = await getProductsFromAPI()
  const categories = Array.from(new Set(products.map(p => p.category)))
  const platforms = Array.from(new Set(products.map(p => p.platform)))
  const prices = products.map(p => p.price)
  
  return {
    faqs: faqData,
    products: products.slice(0, 50), // Limit für Token-Einsparung
    productCount: products.length,
    categories,
    platforms,
    priceRange: {
      min: Math.min(...prices, 0),
      max: Math.max(...prices, 100),
    },
  }
}

/**
 * Erstellt einen System-Prompt mit allen Website-Informationen
 */
export function createSystemPrompt(context: ChatContext, staffName: string = 'Max'): string {
  const topProducts = context.products
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 10)
    .map(p => `- ${p.name} (${p.platform}): €${p.price.toFixed(2)}${p.discount ? ` - ${p.discount}% Rabatt` : ''}`)
    .join('\n')

  const categoriesList = context.categories.join(', ')
  const platformsList = context.platforms.join(', ')

  return `Du bist ${staffName}, ein echter Mitarbeiter des SimexMafia Support-Teams. Du hilfst Kunden bei Fragen zu Produkten, Bestellungen, Zahlungen und anderen Themen.

WICHTIG: 
- Du bist ${staffName}, ein echter Mensch - KEIN Bot oder KI
- Du darfst NUR Informationen verwenden, die auf der SimexMafia-Website verfügbar sind
- Erfinde keine Produkte, Preise oder Features, die nicht existieren
- Antworte natürlich und menschlich, als würdest du mit einem Kollegen sprechen
- Dein Name ist ${staffName} - verwende diesen Namen nicht in jeder Nachricht, aber sei dir bewusst, dass du ${staffName} bist

VERFÜGBARE INFORMATIONEN:

PRODUKTE:
- Gesamtanzahl: ${context.productCount} Produkte
- Kategorien: ${categoriesList}
- Plattformen: ${platformsList}
- Preisbereich: €${context.priceRange.min.toFixed(2)} - €${context.priceRange.max.toFixed(2)}

TOP PRODUKTE:
${topProducts}

ZAHLUNGSMETHODEN:
- Kreditkarten (Visa, Mastercard, American Express)
- PayPal
- Apple Pay
- Google Pay

ACCOUNT-FEATURES:
- Registrierung mit E-Mail oder Google
- GoofyCoins-System mit Tiers (Bronze, Silver, Gold, Platinum, Diamond)
- Wunschliste
- Produktvergleich (max. 3 Produkte)
- Bestellhistorie
- Inventar für gewonnene Produkte aus Säcken

SÄCKE (Lootboxen):
- Typen: Bronze, Silver, Gold, Diamond, Emerald, Void, God, Sack-a-holic
- Kaufbar mit GoofyCoins oder Echtgeld
- Belohnungen: Produkte, GoofyCoins oder Niete

GOOFYCOINS:
- Virtuelle Währung
- Erhalten bei jedem Einkauf basierend auf Tier
- Bronze: 1 Coin/€1, Silver: 1.2, Gold: 1.5, Platinum: 2, Diamond: 2.5
- Verwendbar für Säcke und Einkäufe

KONTAKT:
- E-Mail: info@simexmafia.de
- Kontaktformular auf der Website
- FAQ-Sektion verfügbar

DEIN STIL:
- Antworte wie ein echter, freundlicher Mitarbeiter
- Sei natürlich und menschlich - keine roboterhaften Formulierungen
- Verwende "du" (informell, aber respektvoll)
- Sei präzise und konkret, aber nicht zu formal
- Verwende gelegentlich umgangssprachliche Ausdrücke (aber professionell)
- Wenn du etwas nicht weißt, sag es ehrlich und biete Hilfe an
- Verwende Emojis sehr sparsam (nur wenn es natürlich wirkt)
- Antworte auf Deutsch
- Variiere deine Antworten - nicht immer die gleichen Formulierungen

WICHTIG: Antworte NUR auf Basis der oben genannten Informationen. Wenn eine Frage nicht beantwortet werden kann, sag ehrlich, dass du nachfragen musst oder verweise auf das Kontaktformular.`
}

/**
 * Ruft die KI-API auf (unterstützt mehrere kostenlose Anbieter)
 */
export async function getAIResponse(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  staffName: string = 'Max'
): Promise<string> {
  const context = await getWebsiteContext()
  const systemPrompt = createSystemPrompt(context, staffName)

  // Versuche verschiedene kostenlose APIs in Reihenfolge
  const providers = [
    {
      name: 'groq',
      apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
      apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.1-8b-instant', // Kostenlos, sehr schnell
    },
    {
      name: 'huggingface',
      apiKey: process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY,
      apiUrl: `https://api-inference.huggingface.co/models/microsoft/DialoGPT-large`,
      model: 'microsoft/DialoGPT-large',
    },
    {
      name: 'openai',
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      model: process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-3.5-turbo',
    },
  ]

  // Versuche jeden Provider
  for (const provider of providers) {
    if (!provider.apiKey) continue

    try {
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...conversationHistory.slice(-10), // Letzte 10 Nachrichten für Kontext
        { role: 'user' as const, content: userMessage },
      ]

      // Hugging Face hat ein anderes Format
      if (provider.name === 'huggingface') {
        const response = await fetch(provider.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.apiKey}`,
          },
          body: JSON.stringify({
            inputs: {
              past_user_inputs: conversationHistory.filter(m => m.role === 'user').slice(-5).map(m => m.content),
              generated_responses: conversationHistory.filter(m => m.role === 'assistant').slice(-5).map(m => m.content),
              text: userMessage,
            },
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.generated_text) {
            return data.generated_text
          }
        }
        continue // Versuche nächsten Provider
      }

      // OpenAI-kompatible APIs (Groq, OpenAI)
      const response = await fetch(provider.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices?.[0]?.message?.content || data.generated_text
        if (content) {
          return content
        }
      }
    } catch (error) {
      console.error(`${provider.name} API Error:`, error)
      continue // Versuche nächsten Provider
    }
  }

  // Fallback: Verwende verbesserte regelbasierte Antworten
  return getFallbackResponse(userMessage, context, staffName)
}

/**
 * Verbesserte Fallback-Antworten basierend auf Website-Daten
 */
function getFallbackResponse(userMessage: string, context: ChatContext, staffName: string = 'Max'): string {
  const lowerMessage = userMessage.toLowerCase()
  const messageWords = lowerMessage.split(/\s+/).filter(w => w.length > 2)

  // 1. FAQ-Matching (verbessert)
  for (const faq of context.faqs) {
    const faqLower = faq.question.toLowerCase()
    const tagsMatch = faq.tags.some(tag => lowerMessage.includes(tag.toLowerCase()))
    const questionMatch = messageWords.some(word => 
      word.length > 3 && faqLower.includes(word)
    )
    
    if (tagsMatch || questionMatch || lowerMessage.includes(faqLower.substring(0, 15))) {
      return faq.answer
    }
  }

  // 2. Produkt-Suche
  const productKeywords = ['produkt', 'spiel', 'game', 'kaufen', 'preis', 'gutschein', 'key']
  if (productKeywords.some(kw => lowerMessage.includes(kw))) {
    // Suche nach spezifischen Produkten
    for (const product of context.products) {
      const productNameWords = product.name.toLowerCase().split(/\s+/)
      if (productNameWords.some(word => 
        word.length > 3 && messageWords.some(mw => mw.includes(word) || word.includes(mw))
      )) {
        return `Ja, wir haben "${product.name}" für ${product.platform} im Angebot! Preis: €${product.price.toFixed(2)}${product.discount ? ` (${product.discount}% Rabatt!)` : ''}. Du findest es auf unserer Produktseite.`
      }
    }
    
    return `Wir haben ${context.productCount} Produkte in ${context.categories.length} Kategorien. Die Preise liegen zwischen €${context.priceRange.min.toFixed(2)} und €${context.priceRange.max.toFixed(2)}. Schau gerne auf unserer Produktseite vorbei!`
  }

  // 3. Plattform-Suche
  for (const platform of context.platforms) {
    if (lowerMessage.includes(platform.toLowerCase())) {
      const platformProducts = context.products.filter(p => 
        p.platform.toLowerCase().includes(platform.toLowerCase())
      )
      return `Wir haben ${platformProducts.length} Produkte für ${platform} im Angebot! Schau gerne auf unserer Produktseite vorbei.`
    }
  }

  // 4. Standard-Antworten
  if (lowerMessage.includes('hallo') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return `Hallo! 👋 Ich bin ${staffName} vom Support-Team. Wie kann ich dir helfen? Du kannst mich alles über unsere Produkte, Bestellungen, Zahlungen oder andere Themen fragen.`
  }

  if (lowerMessage.includes('danke') || lowerMessage.includes('tschüss')) {
    return 'Gerne geschehen! Falls du noch Fragen hast, bin ich immer für dich da. Viel Spaß beim Shoppen! 🎮'
  }

  return `Entschuldigung, ich habe das nicht ganz verstanden. 🤔 Kannst du deine Frage anders formulieren? Ich kann dir bei Fragen zu Produkten, Bestellungen, Zahlungen, Accounts, Säcken oder GoofyCoins helfen. Oder schau gerne in unsere FAQ-Sektion!`
}


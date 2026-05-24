// Product search: token matching, field weights, deduplication

import { isSimexDiscordServerProduct } from '@/lib/products/simex-discord-server'

function normalizeSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-äöüß]/gi, '')
    .replace(/\s+/g, ' ')
}

function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length
  if (len1 === 0) return len2
  if (len2 === 0) return len1

  const matrix: number[][] = []
  for (let i = 0; i <= len2; i++) matrix[i] = [i]
  for (let j = 0; j <= len1; j++) matrix[0][j] = j

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[len2][len1]
}

function similarityScore(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 1
  return 1 - levenshteinDistance(str1, str2) / maxLen
}

const SEARCH_SYNONYMS: Record<string, string[]> = {
  vbucks: ['v-bucks', 'v bucks', 'vbucks', 'fortnite'],
  'v-bucks': ['vbucks', 'v bucks', 'fortnite'],
  fortnite: ['fortnite', 'fn', 'vbucks', 'v-bucks'],
  steam: ['steam', 'valve'],
  playstation: ['playstation', 'ps', 'ps4', 'ps5', 'sony'],
  xbox: ['xbox', 'microsoft'],
  nintendo: ['nintendo', 'switch'],
  'epic games': ['epic', 'epicgames'],
  'call of duty': ['cod', 'call of duty'],
  'gift card': ['giftcard', 'gift-card', 'gutschein'],
  'gift cards': ['giftcard', 'gutscheine'],
  'game pass': ['gamepass', 'game-pass', 'xbox game pass'],
  'playstation plus': ['ps plus', 'psplus', 'ps+'],
  discord: ['discord', 'dc'],
  simex: ['simex', 'simexmafia', 'simex mafia'],
  nitro: ['nitro', 'discord nitro'],
}

function expandSearchTokens(term: string): string[] {
  const normalized = normalizeSearchTerm(term)
  const tokens = new Set<string>([normalized])

  for (const word of normalized.split(/\s+/)) {
    if (word.length > 1) tokens.add(word)
  }

  for (const [key, synonyms] of Object.entries(SEARCH_SYNONYMS)) {
    if (normalized.includes(key) || synonyms.some((s) => normalized.includes(s))) {
      tokens.add(key)
      synonyms.forEach((s) => tokens.add(s))
    }
  }

  return Array.from(tokens)
}

export interface ProductSearchFields {
  name: string
  description?: string
  platform?: string
  category?: string
  tags?: string[]
}

/**
 * Relevanz-Score 0–100 (höher = besser). 0 = kein Treffer.
 */
export function scoreProduct(
  product: ProductSearchFields,
  searchTerm: string
): number {
  const query = normalizeSearchTerm(searchTerm)
  if (!query) return 0

  const name = normalizeSearchTerm(product.name)
  const platform = normalizeSearchTerm(product.platform || '')
  const category = normalizeSearchTerm(product.category || '')
  const tagsText = (product.tags || []).map(normalizeSearchTerm).join(' ')
  const description = normalizeSearchTerm(product.description || '')
  const searchLower = searchTerm.toLowerCase().trim()

  const isSimexDiscordSearch =
    searchLower.includes('simex') ||
    (searchLower.includes('discord') && !searchLower.includes('nitro'))

  if (isSimexDiscordSearch && isSimexDiscordServerProduct(product)) {
    return 100
  }

  if (name === query) return 100
  if (name.startsWith(query)) return 96

  const queryTokens = query.split(/\s+/).filter((t) => t.length > 1)
  if (queryTokens.length > 0) {
    const allInName = queryTokens.every((t) => name.includes(t))
    if (allInName) return 94

    const allInPrimary = queryTokens.every(
      (t) => name.includes(t) || platform.includes(t) || tagsText.includes(t)
    )
    if (allInPrimary) return 88
  }

  if (query.length >= 3 && name.includes(query)) return 90
  if (query.length >= 3 && platform.includes(query)) return 82
  if (query.length >= 3 && tagsText.includes(query)) return 78
  if (query.length >= 4 && category.includes(query)) return 72
  if (query.length >= 4 && description.includes(query)) return 58

  const expanded = expandSearchTokens(query)
  for (const token of expanded) {
    if (token.length < 3) continue
    if (name.includes(token)) return Math.max(75, 70 + token.length)
    if (platform.includes(token)) return 70
    if (tagsText.includes(token)) return 68
  }

  if (query.length >= 4) {
    const nameSimilarity = similarityScore(query, name)
    if (nameSimilarity >= 0.82) return Math.round(nameSimilarity * 72)
  }

  if (queryTokens.length === 1 && queryTokens[0].length >= 3) {
    const token = queryTokens[0]
    if (name.split(/\s+/).some((w) => w.startsWith(token))) return 76
  }

  return 0
}

export function matchesProduct(
  product: ProductSearchFields,
  searchTerm: string,
  options: { fuzzyThreshold?: number; requireExactMatch?: boolean } = {}
): { matches: boolean; score: number } {
  const score = scoreProduct(product, searchTerm)
  const minScore = options.requireExactMatch
    ? 90
    : Math.round((options.fuzzyThreshold ?? 0.5) * 100)
  const normalizedScore = score / 100
  return {
    matches: score >= minScore,
    score: normalizedScore,
  }
}

function dedupeProducts<T extends ProductSearchFields & { id: string }>(products: T[]): T[] {
  const seenIds = new Set<string>()
  const seenNames = new Set<string>()
  const result: T[] = []

  for (const product of products) {
    const nameKey = normalizeSearchTerm(product.name)
    if (seenIds.has(product.id) || seenNames.has(nameKey)) continue
    seenIds.add(product.id)
    seenNames.add(nameKey)
    result.push(product)
  }

  return result
}

export function searchProducts<T extends ProductSearchFields & { id: string }>(
  products: T[],
  searchTerm: string,
  options: {
    fuzzyThreshold?: number
    minScore?: number
    maxResults?: number
  } = {}
): T[] {
  const maxResults = options.maxResults ?? 100
  const minScore =
    options.minScore ??
    (options.fuzzyThreshold != null
      ? Math.round(options.fuzzyThreshold * 100)
      : 52)

  if (!searchTerm.trim()) {
    return products.slice(0, maxResults)
  }

  const scored = products
    .map((product) => ({
      product,
      score: scoreProduct(product, searchTerm),
    }))
    .filter((item) => item.score >= minScore)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.product.name.length - b.product.name.length
    })

  const unique = dedupeProducts(scored.map((item) => item.product))
  return unique.slice(0, maxResults)
}

export function generateSearchSuggestions(
  products: { name: string; platform?: string; category?: string }[],
  partialInput: string,
  maxSuggestions: number = 5
): string[] {
  if (!partialInput.trim() || partialInput.length < 2) {
    return []
  }

  const ranked = searchProducts(
    products.map((p, index) => ({
      id: String(index),
      name: p.name,
      platform: p.platform,
      category: p.category,
    })),
    partialInput,
    { minScore: 70, maxResults: maxSuggestions }
  )

  return ranked.map((p) => p.name)
}

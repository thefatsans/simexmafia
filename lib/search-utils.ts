// Intelligent search utilities with fuzzy matching, synonyms, and typo tolerance

/**
 * Normalize search term: remove special characters, convert to lowercase, handle common variations
 */
function normalizeSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
    .replace(/\s+/g, ' ') // Normalize whitespace
}

/**
 * Calculate Levenshtein distance (edit distance) between two strings
 * Used for fuzzy matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []
  const len1 = str1.length
  const len2 = str2.length

  if (len1 === 0) return len2
  if (len2 === 0) return len1

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        )
      }
    }
  }

  return matrix[len2][len1]
}

/**
 * Calculate similarity score between two strings (0-1, where 1 is identical)
 */
function similarityScore(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 1
  const distance = levenshteinDistance(str1, str2)
  return 1 - distance / maxLen
}

/**
 * Product search synonyms and variations
 */
const SEARCH_SYNONYMS: Record<string, string[]> = {
  // Fortnite / V-Bucks
  'vbucks': ['v-bucks', 'v bucks', 'vbucks', 'fortnite vbucks', 'fortnite v-bucks', 'fortnite v bucks'],
  'v-bucks': ['vbucks', 'v bucks', 'fortnite vbucks', 'fortnite v-bucks', 'fortnite v bucks'],
  'fortnite': ['fortnite', 'fn', 'fort nite'],
  
  // Platforms
  'steam': ['steam', 'valve'],
  'playstation': ['playstation', 'ps', 'ps4', 'ps5', 'sony'],
  'xbox': ['xbox', 'x-box', 'microsoft'],
  'nintendo': ['nintendo', 'switch', 'nintendo switch'],
  'epic games': ['epic', 'epic games', 'epicgames'],
  
  // Games
  'call of duty': ['cod', 'call of duty', 'callofduty'],
  'grand theft auto': ['gta', 'grand theft auto', 'grandtheftauto'],
  'counter-strike': ['cs', 'csgo', 'cs2', 'counter-strike', 'counterstrike'],
  'fifa': ['fifa', 'ea sports fifa'],
  'apex legends': ['apex', 'apex legends'],
  'valorant': ['valorant', 'val'],
  'rocket league': ['rl', 'rocket league'],
  
  // Categories
  'gift card': ['giftcard', 'gift-card', 'gutschein'],
  'gift cards': ['giftcards', 'gift-cards', 'gutscheine'],
  'in-game currency': ['currency', 'coins', 'points', 'in-game currency', 'ingame currency'],
  'subscription': ['sub', 'subscription', 'abo'],
  'subscriptions': ['subs', 'subscriptions', 'abos'],
  
  // Common terms
  'wallet': ['wallet', 'guthaben', 'balance'],
  'game pass': ['gamepass', 'game-pass', 'xbox game pass'],
  'playstation plus': ['ps plus', 'psplus', 'playstation plus', 'ps+'],
  
  // Discord / Simex
  'discord': ['discord', 'dc'],
  'simex': ['simex', 'simex mafia', 'simexmafia'],
  'simex discord': ['simex discord', 'simex discord server', 'simex geheimer discord', 'simex geheimer discord-server'],
}

/**
 * Expand search term with synonyms
 */
function expandSearchTerm(term: string): string[] {
  const normalized = normalizeSearchTerm(term)
  const terms = [normalized]
  
  // Check for synonyms
  for (const [key, synonyms] of Object.entries(SEARCH_SYNONYMS)) {
    if (normalized.includes(key) || synonyms.some(s => normalized.includes(s))) {
      terms.push(...synonyms)
      terms.push(key)
    }
  }
  
  // Split into words and add individual words
  const words = normalized.split(/\s+/)
  words.forEach(word => {
    if (word.length > 2) {
      terms.push(word)
    }
  })
  
  return Array.from(new Set(terms)) // Remove duplicates
}

/**
 * Check if search term matches product (with fuzzy matching)
 */
export function matchesProduct(
  product: { name: string; description?: string; platform?: string; category?: string; tags?: string[] },
  searchTerm: string,
  options: { fuzzyThreshold?: number; requireExactMatch?: boolean } = {}
): { matches: boolean; score: number } {
  const { fuzzyThreshold = 0.6, requireExactMatch = false } = options
  
  const normalizedSearch = normalizeSearchTerm(searchTerm)
  const expandedTerms = expandSearchTerm(searchTerm)
  
  // Exact match check
  const productText = [
    product.name,
    product.description || '',
    product.platform || '',
    product.category || '',
    ...(product.tags || []),
  ]
    .join(' ')
    .toLowerCase()
  
  // Check exact matches first
  for (const term of expandedTerms) {
    if (productText.includes(term)) {
      return { matches: true, score: 1.0 }
    }
  }
  
  // If exact match required, return false
  if (requireExactMatch) {
    return { matches: false, score: 0 }
  }
  
  // Fuzzy matching
  const words = productText.split(/\s+/)
  let bestScore = 0
  
  for (const term of expandedTerms) {
    // Check word-by-word similarity
    for (const word of words) {
      if (word.length > 2) {
        const score = similarityScore(term, word)
        if (score > bestScore) {
          bestScore = score
        }
      }
    }
    
    // Check substring similarity
    if (productText.length > 0) {
      const substringScore = similarityScore(term, productText.substring(0, Math.min(term.length + 10, productText.length)))
      if (substringScore > bestScore) {
        bestScore = substringScore
      }
    }
  }
  
  // Check if any word in search term is contained in product
  const searchWords = normalizedSearch.split(/\s+/)
  let containedWords = 0
  for (const word of searchWords) {
    if (word.length > 2 && productText.includes(word)) {
      containedWords++
    }
  }
  
  // Boost score if multiple words match
  if (containedWords > 0) {
    const wordMatchScore = containedWords / searchWords.length
    bestScore = Math.max(bestScore, wordMatchScore * 0.8)
  }
  
  return {
    matches: bestScore >= fuzzyThreshold,
    score: bestScore,
  }
}

/**
 * Filter and rank products based on search term
 */
export function searchProducts<T extends { name: string; description?: string; platform?: string; category?: string; tags?: string[] }>(
  products: T[],
  searchTerm: string,
  options: { fuzzyThreshold?: number; maxResults?: number } = {}
): T[] {
  const { fuzzyThreshold = 0.5, maxResults = 100 } = options
  
  if (!searchTerm.trim()) {
    return products
  }
  
  const normalizedSearch = normalizeSearchTerm(searchTerm)
  const searchLower = searchTerm.toLowerCase().trim()
  
  // Special handling for "simex" or "discord" searches - prioritize Discord-Server product
  const isSimexDiscordSearch = searchLower.includes('simex') || 
                                (searchLower.includes('discord') && !searchLower.includes('nitro'))
  
  // Score all products
  const scoredProducts = products
    .map(product => {
      const match = matchesProduct(product, searchTerm, { fuzzyThreshold })
      let score = match.score
      
      const productNameLower = product.name.toLowerCase().trim()
      
      // Special boost for "Simex Geheimer Discord-Server" when searching for "simex" or "discord"
      if (isSimexDiscordSearch) {
        if (productNameLower.includes('simex') && productNameLower.includes('discord') && productNameLower.includes('server')) {
          // Maximum priority for Discord-Server product
          score = 1.0
        } else if (productNameLower.includes('discord') && !productNameLower.includes('nitro')) {
          // Lower priority for other Discord products
          score = Math.max(score, 0.3)
        }
      }
      
      // Boost score for exact name matches
      if (productNameLower === normalizedSearch) {
        score = 1.0
      } else if (productNameLower.includes(normalizedSearch) && normalizedSearch.length > 3) {
        score = Math.max(score, 0.9)
      }
      
      return {
        product,
        match: { ...match, score },
      }
    })
    .filter(item => item.match.matches)
    .sort((a, b) => {
      const aName = a.product.name.toLowerCase().trim()
      const bName = b.product.name.toLowerCase().trim()
      
      // Special priority for Discord-Server when searching for simex/discord
      if (isSimexDiscordSearch) {
        const aIsDiscordServer = aName.includes('simex') && aName.includes('discord') && aName.includes('server')
        const bIsDiscordServer = bName.includes('simex') && bName.includes('discord') && bName.includes('server')
        if (aIsDiscordServer && !bIsDiscordServer) return -1
        if (!aIsDiscordServer && bIsDiscordServer) return 1
      }
      
      // First sort by score
      if (b.match.score !== a.match.score) {
        return b.match.score - a.match.score
      }
      
      // Then by exact name match
      const aExact = aName === normalizedSearch
      const bExact = bName === normalizedSearch
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      
      // Finally by name length (shorter names first for exact matches)
      return a.product.name.length - b.product.name.length
    })
    .slice(0, maxResults)
    .map(item => item.product)
  
  return scoredProducts
}

/**
 * Generate search suggestions based on partial input
 */
export function generateSearchSuggestions(
  products: { name: string; platform?: string; category?: string }[],
  partialInput: string,
  maxSuggestions: number = 5
): string[] {
  if (!partialInput.trim() || partialInput.length < 2) {
    return []
  }
  
  const normalized = normalizeSearchTerm(partialInput)
  const suggestions = new Set<string>()
  
  // Extract common words/phrases from product names
  const commonTerms = new Map<string, number>()
  
  products.forEach(product => {
    const name = normalizeSearchTerm(product.name)
    const words = name.split(/\s+/)
    
    // Add full product name if it starts with input
    if (name.startsWith(normalized)) {
      suggestions.add(product.name)
    }
    
    // Count word occurrences
    words.forEach(word => {
      if (word.length >= 3 && word.startsWith(normalized.substring(0, Math.min(3, normalized.length)))) {
        commonTerms.set(word, (commonTerms.get(word) || 0) + 1)
      }
    })
  })
  
  // Add popular terms
  Array.from(commonTerms.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxSuggestions)
    .forEach(([term]) => {
      if (term.length >= normalized.length) {
        suggestions.add(term)
      }
    })
  
  return Array.from(suggestions).slice(0, maxSuggestions)
}




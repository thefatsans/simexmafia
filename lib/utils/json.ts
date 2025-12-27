/**
 * Safely parse JSON string with error handling
 * @param jsonString - The JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback value
 */
export function safeJsonParse<T = any>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString || jsonString.trim() === '') {
    return fallback
  }

  try {
    return JSON.parse(jsonString) as T
  } catch (error) {
    console.error('JSON parse error:', error, 'String:', jsonString.substring(0, 100))
    return fallback
  }
}

/**
 * Safely parse JSON from localStorage
 * @param key - localStorage key
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback value
 */
export function safeLocalStorageParse<T = any>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const item = localStorage.getItem(key)
    return safeJsonParse(item, fallback)
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error)
    // Try to clear corrupted data
    try {
      localStorage.removeItem(key)
    } catch (e) {
      // Ignore
    }
    return fallback
  }
}

/**
 * Safely parse JSON from API response
 * @param response - Fetch Response object
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback value
 */
export async function safeResponseJson<T = any>(response: Response, fallback: T): Promise<T> {
  try {
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Response is not JSON, content-type:', contentType)
      return fallback
    }

    const text = await response.text()
    if (!text || text.trim() === '') {
      return fallback
    }

    return safeJsonParse(text, fallback)
  } catch (error) {
    console.error('Error parsing response JSON:', error)
    return fallback
  }
}






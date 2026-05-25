import { config } from 'dotenv'
import { resolve } from 'path'

let loaded = false

/**
 * Ensures .env.local wins over the template .env (which must not contain a real DATABASE_URL).
 */
export function loadLocalEnv(): void {
  if (loaded) return
  loaded = true

  config({ path: resolve(process.cwd(), '.env') })
  config({ path: resolve(process.cwd(), '.env.local'), override: true })
}

export function getDatabaseUrl(): string | undefined {
  loadLocalEnv()
  return process.env.DATABASE_URL
}

/**
 * Normalizes Supabase DATABASE_URL for the current runtime.
 * Vercel/serverless: Transaction pooler (port 6543) — required for reliable connections.
 * Local dev: Session pooler (port 5432) is fine.
 */
export function resolveSupabaseDatabaseUrl(raw: string): string {
  if (!raw?.trim()) return raw

  let dbUrl = raw.trim()
  const isServerless = Boolean(process.env.VERCEL)

  if (!dbUrl.includes('supabase') && !dbUrl.includes('pooler')) {
    return dbUrl
  }

  const match = dbUrl.match(
    /^postgres(ql)?:\/\/([^:]+):([^@]+)@([^/:]+)(?::(\d+))?\/([^?]+)(?:\?(.+))?$/i
  )

  if (!match) {
    return dbUrl
  }

  const [, , username, password, host, port, database, queryString] = match
  let projectRef: string | null = null

  if (username.includes('.')) {
    projectRef = username.split('.')[1]
  } else {
    const dbMatch = host.match(/db\.([^.]+)\.supabase\.co/)
    projectRef = dbMatch?.[1] || null
  }

  const params = new URLSearchParams(queryString || '')
  if (!params.has('sslmode')) {
    params.set('sslmode', 'require')
  }

  if (isServerless) {
    // Transaction pooler for serverless (Vercel)
    const poolerHost =
      process.env.SUPABASE_POOLER_HOST || 'aws-0-eu-west-1.pooler.supabase.com'
    const poolerPort = process.env.SUPABASE_POOLER_PORT || '6543'
    const poolerUser = projectRef ? `postgres.${projectRef}` : username

    params.set('pgbouncer', 'true')
    params.delete('connection_limit')

    const query = params.toString()
    dbUrl = `postgresql://${poolerUser}:${password}@${poolerHost}:${poolerPort}/${database}${query ? `?${query}` : ''}`
    return dbUrl
  }

  // Local: keep pooler session mode or convert direct → session pooler
  if (projectRef && !host.includes('pooler')) {
    const poolerHost =
      process.env.SUPABASE_POOLER_HOST || 'aws-0-eu-west-1.pooler.supabase.com'
    const poolerPort = process.env.SUPABASE_POOLER_PORT || '5432'
    const poolerUser = `postgres.${projectRef}`
    const query = params.toString()
    dbUrl = `postgresql://${poolerUser}:${password}@${poolerHost}:${poolerPort}/${database}${query ? `?${query}` : ''}`
  }

  return dbUrl
}

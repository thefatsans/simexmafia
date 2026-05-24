/** Öffentliche Site-URL für E-Mails, SEO, Redirects */
const DEFAULT_SITE_URL = 'https://simexmafia.vercel.app'

export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!url) return DEFAULT_SITE_URL
  return url.replace(/\/$/, '')
}

export function sitePath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${getSiteUrl()}${normalized}`
}

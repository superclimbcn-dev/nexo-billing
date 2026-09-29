const LOCAL_APP_URL = 'http://localhost:3000'

export function getCanonicalAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim()
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  const candidate = configured || (vercelProduction ? `https://${vercelProduction}` : '')

  if (!candidate) {
    if (process.env.NODE_ENV !== 'production') return LOCAL_APP_URL
    throw new Error('NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL must be configured in production')
  }

  const url = new URL(candidate)
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
    throw new Error('The canonical application URL must use HTTPS outside localhost')
  }

  return url.origin
}

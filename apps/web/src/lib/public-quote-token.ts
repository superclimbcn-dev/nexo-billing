import jwt from 'jsonwebtoken'

function getQuoteTokenSecret(): string {
  const secret =
    process.env.PUBLIC_QUOTE_TOKEN_SECRET?.trim() ||
    process.env.PUBLIC_INVOICE_TOKEN_SECRET?.trim() ||
    process.env.SUPABASE_JWT_SECRET?.trim()

  if (secret) return secret

  if (process.env.NODE_ENV !== 'production') {
    return 'dev-fallback-only-not-secure'
  }

  throw new Error('PUBLIC_QUOTE_TOKEN_SECRET is not configured')
}

export interface QuoteTokenPayload {
  quoteId: string
  tenantId: string
}

export function signQuoteToken(payload: QuoteTokenPayload): string {
  return jwt.sign(payload, getQuoteTokenSecret(), { expiresIn: '30d' })
}

export function verifyQuoteToken(token: string): QuoteTokenPayload {
  const decoded = jwt.verify(token, getQuoteTokenSecret())
  if (typeof decoded !== 'object' || decoded === null) {
    throw new Error('Invalid token payload')
  }
  const { quoteId, tenantId } = decoded as Record<string, unknown>
  if (typeof quoteId !== 'string' || typeof tenantId !== 'string') {
    throw new Error('Invalid token shape')
  }
  return { quoteId, tenantId }
}

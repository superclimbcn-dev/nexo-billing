import jwt from 'jsonwebtoken'

function getInvoiceTokenSecret(): string {
  const secret =
    process.env.PUBLIC_INVOICE_TOKEN_SECRET?.trim() ||
    process.env.SUPABASE_JWT_SECRET?.trim()

  if (secret) return secret

  if (process.env.NODE_ENV !== 'production') {
    return 'dev-fallback-only-not-secure'
  }

  throw new Error('PUBLIC_INVOICE_TOKEN_SECRET is not configured')
}

export interface InvoiceTokenPayload {
  invoiceId: string
  tenantId: string
}

export function signInvoiceToken(payload: InvoiceTokenPayload): string {
  return jwt.sign(payload, getInvoiceTokenSecret(), { expiresIn: '30d' })
}

export function verifyInvoiceToken(token: string): InvoiceTokenPayload {
  const decoded = jwt.verify(token, getInvoiceTokenSecret())
  if (typeof decoded !== 'object' || decoded === null) {
    throw new Error('Invalid token payload')
  }
  const { invoiceId, tenantId } = decoded as Record<string, unknown>
  if (typeof invoiceId !== 'string' || typeof tenantId !== 'string') {
    throw new Error('Invalid token shape')
  }
  return { invoiceId, tenantId }
}

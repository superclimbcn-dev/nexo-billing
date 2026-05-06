import jwt from 'jsonwebtoken'

const SECRET =
  process.env.PUBLIC_INVOICE_TOKEN_SECRET ??
  process.env.SUPABASE_JWT_SECRET ??
  'dev-fallback-only-not-secure'

export interface InvoiceTokenPayload {
  invoiceId: string
  tenantId: string
}

export function signInvoiceToken(payload: InvoiceTokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' })
}

export function verifyInvoiceToken(token: string): InvoiceTokenPayload {
  const decoded = jwt.verify(token, SECRET)
  if (typeof decoded !== 'object' || decoded === null) {
    throw new Error('Invalid token payload')
  }
  const { invoiceId, tenantId } = decoded as Record<string, unknown>
  if (typeof invoiceId !== 'string' || typeof tenantId !== 'string') {
    throw new Error('Invalid token shape')
  }
  return { invoiceId, tenantId }
}

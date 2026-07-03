import jwt from 'jsonwebtoken'

function getReceiptTokenSecret(): string {
  const secret =
    process.env.PUBLIC_RECEIPT_TOKEN_SECRET?.trim() ||
    process.env.PUBLIC_QUOTE_TOKEN_SECRET?.trim() ||
    process.env.PUBLIC_INVOICE_TOKEN_SECRET?.trim() ||
    process.env.SUPABASE_JWT_SECRET?.trim()

  if (secret) return secret

  if (process.env.NODE_ENV !== 'production') {
    return 'dev-fallback-only-not-secure'
  }

  throw new Error('PUBLIC_RECEIPT_TOKEN_SECRET is not configured')
}

export interface ReceiptTokenPayload {
  receiptId: string
  tenantId: string
}

export function signReceiptToken(payload: ReceiptTokenPayload): string {
  return jwt.sign(payload, getReceiptTokenSecret(), { expiresIn: '30d' })
}

export function verifyReceiptToken(token: string): ReceiptTokenPayload {
  const decoded = jwt.verify(token, getReceiptTokenSecret())
  if (typeof decoded !== 'object' || decoded === null) {
    throw new Error('Invalid token payload')
  }
  const { receiptId, tenantId } = decoded as Record<string, unknown>
  if (typeof receiptId !== 'string' || typeof tenantId !== 'string') {
    throw new Error('Invalid token shape')
  }
  return { receiptId, tenantId }
}

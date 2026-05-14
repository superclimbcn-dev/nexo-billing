import 'server-only'
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ENCRYPTION_KEY = process.env.TENANT_SECRET_ENCRYPTION_KEY

function getKey(): Buffer {
  if (!ENCRYPTION_KEY) {
    throw new Error('TENANT_SECRET_ENCRYPTION_KEY not configured')
  }
  return scryptSync(ENCRYPTION_KEY, 'nexo-billing-salt', 32)
}

export function encryptSecret(plainText: string): string {
  const key = getKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  let encrypted = cipher.update(plainText, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decryptSecret(cipherText: string): string {
  const key = getKey()
  const [ivHex, authTagHex, encrypted] = cipherText.split(':')
  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted secret format')
  }
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

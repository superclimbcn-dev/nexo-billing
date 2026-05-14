import { createHash } from 'node:crypto'

/**
 * Canonically serialize a value for hashing.
 *
 * Rules (per AEAT Verifactu specification):
 *  - Objects: keys sorted alphabetically, format key=value&key=value
 *  - Arrays: values joined with commas
 *  - Numbers: fixed to 2 decimal places (e.g. 21 → "21.00")
 *  - Dates: ISO 8601 full format
 *  - Booleans: "true" / "false"
 *  - null/undefined: empty string
 */
function canonicalize(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  if (typeof value === 'number') {
    return value.toFixed(2)
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(canonicalize).join(',')
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined && v !== null)
      .sort(([a], [b]) => a.localeCompare(b))
    return entries.map(([k, v]) => `${k}=${canonicalize(v)}`).join('&')
  }

  return String(value)
}

/**
 * Compute the AEAT Verifactu SHA-256 hash for a record.
 *
 * @param data — the record data (must not include hash/previousHash fields)
 * @param previousHash — hash of the previous record in the chain, or null for the first record
 * @returns lowercase hex SHA-256 string
 */
export function computeRecordHash(
  data: object,
  previousHash: string | null,
): string {
  const canonical = canonicalize(data)
  const payload = previousHash
    ? `${canonical}&previousHash=${previousHash}`
    : canonical
  return createHash('sha256').update(payload, 'utf8').digest('hex')
}

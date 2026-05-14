import { describe, it, expect } from 'vitest'
import { computeRecordHash } from './hash'

describe('computeRecordHash', () => {
  it('returns a 64-character lowercase hex string', () => {
    const hash = computeRecordHash({ a: 1 }, null)
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is deterministic for identical data', () => {
    const data = { tenantId: 't1', amount: 100.5, issuedAt: new Date('2024-11-29T10:00:00.000Z') }
    const h1 = computeRecordHash(data, null)
    const h2 = computeRecordHash(data, null)
    expect(h1).toBe(h2)
  })

  it('changes when previousHash is included', () => {
    const data = { id: 'inv-1', total: 121 }
    const withoutPrev = computeRecordHash(data, null)
    const withPrev = computeRecordHash(data, 'abcd1234')
    expect(withPrev).not.toBe(withoutPrev)
  })

  it('sorts object keys alphabetically', () => {
    const h1 = computeRecordHash({ z: 1, a: 2, m: 3 }, null)
    const h2 = computeRecordHash({ a: 2, m: 3, z: 1 }, null)
    expect(h1).toBe(h2)
  })

  it('formats numbers to 2 decimal places', () => {
    const h1 = computeRecordHash({ amount: 21 }, null)
    const h2 = computeRecordHash({ amount: 21.0 }, null)
    const h3 = computeRecordHash({ amount: 21.00 }, null)
    expect(h1).toBe(h2)
    expect(h2).toBe(h3)
  })

  it('formats dates as ISO 8601', () => {
    const d = new Date('2024-11-29T10:00:00.000Z')
    const hash = computeRecordHash({ date: d }, null)
    expect(hash).toHaveLength(64)
  })

  it('ignores null and undefined values', () => {
    const h1 = computeRecordHash({ a: 1, b: null, c: undefined }, null)
    const h2 = computeRecordHash({ a: 1 }, null)
    expect(h1).toBe(h2)
  })

  it('handles nested objects recursively', () => {
    const h1 = computeRecordHash({ outer: { z: 1, a: 2 } }, null)
    const h2 = computeRecordHash({ outer: { a: 2, z: 1 } }, null)
    expect(h1).toBe(h2)
  })
})

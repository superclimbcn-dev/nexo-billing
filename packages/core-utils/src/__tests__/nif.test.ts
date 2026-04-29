import { describe, it, expect } from 'vitest'
import { formatNif } from '../format/nif'

describe('formatNif', () => {
  it('formats CIF with letter prefix', () => {
    expect(formatNif('B12345678')).toBe('B-12345678')
    expect(formatNif('A87654321')).toBe('A-87654321')
  })

  it('formats NIE with X/Y/Z prefix', () => {
    expect(formatNif('X1234567A')).toBe('X-1234567-A')
    expect(formatNif('Y9876543B')).toBe('Y-9876543-B')
  })

  it('normalises lowercase input', () => {
    expect(formatNif('b12345678')).toBe('B-12345678')
  })

  it('strips existing dashes before reformatting', () => {
    expect(formatNif('B-12345678')).toBe('B-12345678')
  })

  it('returns DNI unchanged (8 digits + letter)', () => {
    // DNIs don't need a separator in Spain
    expect(formatNif('12345678Z')).toBe('12345678Z')
  })
})

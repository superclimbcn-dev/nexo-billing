import { describe, it, expect } from 'vitest'
import { parseNumber } from '../parse/number'

describe('parseNumber', () => {
  it('parses Spanish decimal format', () => {
    expect(parseNumber('15,50')).toBe(15.5)
  })

  it('parses thousands separator', () => {
    expect(parseNumber('1.234,56')).toBe(1234.56)
  })

  it('parses integer-like string', () => {
    expect(parseNumber('42')).toBe(42)
  })

  it('parses zero', () => {
    expect(parseNumber('0,00')).toBe(0)
  })

  it('returns 0 for non-numeric input', () => {
    expect(parseNumber('')).toBe(0)
    expect(parseNumber('abc')).toBe(0)
  })

  it('handles leading and trailing whitespace', () => {
    expect(parseNumber('  15,50  ')).toBe(15.5)
  })
})

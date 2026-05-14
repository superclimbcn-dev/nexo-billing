import { describe, it, expect } from 'vitest'
import { parseCurrency } from '../parse/currency'

describe('parseCurrency', () => {
  it('parses whole euro string', () => {
    expect(parseCurrency('2.375,00 €')).toBe(2375)
  })

  it('parses fractional euro string', () => {
    expect(parseCurrency('1.234,56 €')).toBe(1234.56)
  })

  it('parses value without thousands separator', () => {
    expect(parseCurrency('99,90 €')).toBe(99.9)
  })

  it('parses zero', () => {
    expect(parseCurrency('0,00 €')).toBe(0)
  })

  it('returns 0 for non-numeric input', () => {
    expect(parseCurrency('')).toBe(0)
    expect(parseCurrency('invalid')).toBe(0)
  })

  it('parses without currency symbol', () => {
    expect(parseCurrency('1.000,00')).toBe(1000)
  })
})

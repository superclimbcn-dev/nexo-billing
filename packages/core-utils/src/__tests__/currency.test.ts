import { describe, it, expect } from 'vitest'
import { formatCurrency } from '../format/currency'

describe('formatCurrency', () => {
  it('formats whole euros with two decimal places', () => {
    expect(formatCurrency(2375)).toBe('2.375,00 €')
  })

  it('formats fractional euros', () => {
    expect(formatCurrency(1234.56)).toBe('1.234,56 €')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('0,00 €')
  })

  it('formats negative amounts', () => {
    expect(formatCurrency(-100)).toBe('-100,00 €')
  })

  it('formats small amounts under one euro', () => {
    expect(formatCurrency(0.99)).toBe('0,99 €')
  })

  it('accepts USD currency symbol', () => {
    expect(formatCurrency(100, 'USD')).toBe('100,00 $')
  })
})

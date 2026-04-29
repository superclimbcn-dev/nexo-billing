import { describe, it, expect } from 'vitest'
import { formatNumber } from '../format/number'

describe('formatNumber', () => {
  it('formats with two decimals by default', () => {
    expect(formatNumber(15.5)).toBe('15,50')
  })

  it('formats thousands with dot separator', () => {
    expect(formatNumber(1234567.89)).toBe('1.234.567,89')
  })

  it('accepts custom decimal count', () => {
    expect(formatNumber(1.5, 0)).toBe('2')
    expect(formatNumber(1.5, 1)).toBe('1,5')
    expect(formatNumber(1.5, 3)).toBe('1,500')
  })

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0,00')
  })

  it('formats negative numbers', () => {
    expect(formatNumber(-42.1)).toBe('-42,10')
  })
})

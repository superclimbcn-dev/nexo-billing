import { describe, it, expect } from 'vitest'
import { formatPhone } from '../format/phone'

describe('formatPhone', () => {
  it('formats 9-digit national number', () => {
    expect(formatPhone('666123456')).toBe('+34 666 12 34 56')
  })

  it('formats number with +34 prefix', () => {
    expect(formatPhone('+34666123456')).toBe('+34 666 12 34 56')
  })

  it('formats number with 34 prefix (no plus)', () => {
    expect(formatPhone('34666123456')).toBe('+34 666 12 34 56')
  })

  it('formats landline numbers the same way', () => {
    expect(formatPhone('932123456')).toBe('+34 932 12 34 56')
  })

  it('strips spaces and dashes from input', () => {
    expect(formatPhone('666 12 34 56')).toBe('+34 666 12 34 56')
    expect(formatPhone('666-12-34-56')).toBe('+34 666 12 34 56')
  })
})

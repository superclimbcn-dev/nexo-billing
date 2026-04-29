import { describe, it, expect } from 'vitest'
import { formatIban } from '../format/iban'

describe('formatIban', () => {
  it('groups Spanish IBAN into blocks of 4', () => {
    expect(formatIban('ES1234567890123456789012')).toBe('ES12 3456 7890 1234 5678 9012')
  })

  it('normalises lowercase', () => {
    expect(formatIban('es1234567890123456789012')).toBe('ES12 3456 7890 1234 5678 9012')
  })

  it('removes existing spaces before reformatting', () => {
    expect(formatIban('ES12 3456 7890 1234 5678 9012')).toBe('ES12 3456 7890 1234 5678 9012')
  })

  it('handles short IBANs gracefully', () => {
    expect(formatIban('DE89370400440532013000')).toBe('DE89 3704 0044 0532 0130 00')
  })
})

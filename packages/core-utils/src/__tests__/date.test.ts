import { describe, it, expect } from 'vitest'
import { formatDate } from '../format/date'

describe('formatDate', () => {
  it('formats a Date object in dd/mm/yyyy', () => {
    expect(formatDate(new Date(2026, 3, 29))).toBe('29/04/2026')
  })

  it('formats an ISO string', () => {
    expect(formatDate('2026-01-01T00:00:00Z')).toBe('01/01/2026')
  })

  it('pads single-digit days and months', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('05/01/2026')
  })
})

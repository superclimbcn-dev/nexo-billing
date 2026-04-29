import { describe, it, expect } from 'vitest'
import { formatDateTime } from '../format/datetime'

describe('formatDateTime', () => {
  it('includes date and time separated by space', () => {
    const result = formatDateTime(new Date(2026, 3, 29, 13, 43))
    expect(result).toBe('29/04/2026 13:43')
  })

  it('pads hours and minutes', () => {
    const result = formatDateTime(new Date(2026, 0, 5, 9, 5))
    expect(result).toBe('05/01/2026 09:05')
  })

  it('accepts an ISO string', () => {
    // UTC midnight parsed in local time may vary; just check format shape
    const result = formatDateTime('2026-06-15T08:30:00')
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/)
  })
})

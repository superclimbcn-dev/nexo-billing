import { z } from 'zod'

export const quarterSchema = z.enum(['Q1', 'Q2', 'Q3', 'Q4'])
export const MIN_TAX_YEAR = 2024
export const MAX_TAX_YEARS_AHEAD = 5

export const yearSchema = z
  .number()
  .int()
  .min(MIN_TAX_YEAR)
  .max(new Date().getFullYear() + MAX_TAX_YEARS_AHEAD)

export type Quarter = z.infer<typeof quarterSchema>

export function getQuarterDates(year: number, quarter: Quarter) {
  const map: Record<Quarter, { start: Date; end: Date }> = {
    Q1: {
      start: new Date(year, 0, 1),
      end: new Date(year, 2, 31, 23, 59, 59, 999),
    },
    Q2: {
      start: new Date(year, 3, 1),
      end: new Date(year, 5, 30, 23, 59, 59, 999),
    },
    Q3: {
      start: new Date(year, 6, 1),
      end: new Date(year, 8, 30, 23, 59, 59, 999),
    },
    Q4: {
      start: new Date(year, 9, 1),
      end: new Date(year, 11, 31, 23, 59, 59, 999),
    },
  }
  return map[quarter]
}

export function getQuarterDeadline(year: number, quarter: Quarter): Date {
  const monthMap: Record<Quarter, number> = { Q1: 3, Q2: 6, Q3: 9, Q4: 0 }
  const deadlineYear = quarter === 'Q4' ? year + 1 : year
  const deadlineMonth = monthMap[quarter]
  return new Date(deadlineYear, deadlineMonth, 20)
}

export function getCurrentQuarter(): { year: number; quarter: Quarter } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const quarters: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4']
  const quarter = quarters[Math.floor(month / 3)]!
  return { year, quarter }
}

export function getAvailableTaxYears(referenceYear = new Date().getFullYear()): number[] {
  const start = MIN_TAX_YEAR
  const end = referenceYear + 1
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

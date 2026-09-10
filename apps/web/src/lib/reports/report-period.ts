import { z } from 'zod'
import { getQuarterDates, type Quarter } from '@/app/(app)/impuestos/_lib/impuestos-schema'

export type ReportKind = 'treasury' | 'tax' | 'advisor'
export type PeriodKind = 'month' | 'quarter' | 'year' | 'custom'
export interface ReportPeriod {
  kind: PeriodKind
  start: Date
  end: Date
  label: string
  year: number
  quarter: Quarter
}

const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [y, m, d] = value.split('-').map(Number)
    const date = new Date(y!, m! - 1, d!)
    return date.getFullYear() === y && date.getMonth() === m! - 1 && date.getDate() === d
  }, 'Fecha no válida')

export const reportRequestSchema = z
  .object({
    report: z.enum(['treasury', 'tax', 'advisor']),
    format: z.enum(['pdf', 'csv', 'zip']),
    period: z.enum(['month', 'quarter', 'year', 'custom']),
    year: z.coerce.number().int().min(2024).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']).optional(),
    from: calendarDate.optional(),
    to: calendarDate.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const invalid = (message: string) => ctx.addIssue({ code: 'custom', message })
    if (value.period !== 'custom' && !value.year) invalid('Selecciona un año')
    if (value.period === 'month' && !value.month) invalid('Selecciona un mes')
    if (value.period === 'quarter' && !value.quarter) invalid('Selecciona un trimestre')
    if (value.period === 'custom' && (!value.from || !value.to || value.from > value.to))
      invalid('Selecciona un intervalo válido')
    if (value.report === 'tax' && value.period !== 'quarter')
      invalid('Los informes fiscales requieren un trimestre')
    if (value.report === 'advisor' && value.period === 'custom')
      invalid('Selecciona mes, trimestre o año')
    if (value.report !== 'advisor' && value.format === 'zip') invalid('Formato no válido')
  })
export type ReportRequest = z.infer<typeof reportRequestSchema>

export function dateInput(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function reportDate(date: Date | null): string {
  return date ? dateInput(date).split('-').reverse().join('/') : ''
}
export function resolveReportPeriod(request: ReportRequest): ReportPeriod {
  const year = request.period === 'custom' ? Number(request.from!.slice(0, 4)) : request.year!
  let start: Date
  let end: Date
  if (request.period === 'custom') {
    const parse = (value: string) => {
      const [y, m, d] = value.split('-').map(Number)
      return new Date(y!, m! - 1, d!)
    }
    start = parse(request.from!)
    end = parse(request.to!)
    end.setHours(23, 59, 59, 999)
  } else if (request.period === 'quarter') {
    ;({ start, end } = getQuarterDates(year, request.quarter!))
  } else {
    const month = request.period === 'year' ? 0 : request.month! - 1
    start = new Date(year, month, 1)
    end = new Date(year, request.period === 'year' ? 12 : month + 1, 0, 23, 59, 59, 999)
  }
  const quarter = (['Q1', 'Q2', 'Q3', 'Q4'] as const)[Math.floor(start.getMonth() / 3)]!
  return {
    kind: request.period,
    start,
    end,
    year,
    quarter,
    label: `${reportDate(start)} – ${reportDate(end)}`,
  }
}

export function defaultReportRequest(report: ReportKind = 'treasury'): ReportRequest {
  const now = new Date()
  return {
    report,
    format: 'pdf',
    period: report === 'tax' ? 'quarter' : 'month',
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    quarter: (['Q1', 'Q2', 'Q3', 'Q4'] as const)[Math.floor(now.getMonth() / 3)]!,
  }
}

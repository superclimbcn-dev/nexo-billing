import { describe, expect, it } from 'vitest'
import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { mkdirSync, writeFileSync } from 'node:fs'
import JSZip from 'jszip'
import Papa from 'papaparse'
import { ReportPreview } from '@/app/(app)/informes/_components/report-preview'
import { getQuarterDates } from '@/app/(app)/impuestos/_lib/impuestos-schema'
import { reportRequestSchema, resolveReportPeriod, reportDate } from '../report-period'
import { buildTreasuryReport } from '../treasury-report'
import { encodeCsv, reportCsv, reportZip } from '../report-csv'
import { expenseDeductions } from '../report-tables'
import { ReportPdfDocument, pdfColumnGroups } from '../report-pdf'
import { REPORT_NOTICE } from '../report-types'
import { invoice, expense, request, now, fixtureReport } from './report-fixtures'

const period = resolveReportPeriod(request)

describe('report periods', () => {
  it('includes the complete leap-year month and end of day', () => {
    const p = resolveReportPeriod({ ...request, period: 'month', year: 2024, month: 2 })
    expect(reportDate(p.start)).toBe('01/02/2024')
    expect(reportDate(p.end)).toBe('29/02/2024')
    expect(p.end.getHours()).toBe(23)
    expect(p.end.getMilliseconds()).toBe(999)
  })
  it.each(['Q1', 'Q2', 'Q3', 'Q4'] as const)(
    'uses exactly the fiscal engine boundaries for %s',
    (quarter) => {
      const p = resolveReportPeriod({ ...request, quarter })
      expect({ start: p.start, end: p.end }).toEqual(getQuarterDates(2026, quarter))
    },
  )
  it('covers the year and a custom interval across years', () => {
    const annual = resolveReportPeriod({ ...request, period: 'year' })
    expect(reportDate(annual.start)).toBe('01/01/2026')
    expect(reportDate(annual.end)).toBe('31/12/2026')
    const custom = resolveReportPeriod({
      ...request,
      report: 'treasury',
      period: 'custom',
      from: '2025-12-20',
      to: '2026-01-05',
    })
    expect(reportDate(custom.start)).toBe('20/12/2025')
    expect(reportDate(custom.end)).toBe('05/01/2026')
  })
  it.each([
    { month: 13, period: 'month' },
    { quarter: 'Q5' },
    { year: 'bad' },
    { report: 'treasury', period: 'custom', from: '2026-02-30', to: '2026-03-05' },
    { report: 'treasury', period: 'custom', from: '2026-09-30', to: '2026-09-01' },
    { report: 'tax', period: 'month', month: 9 },
    { report: 'advisor', period: 'custom' },
    { tenantId: 'another-company' },
  ])('rejects invalid or tenant-controlled parameters %j', (override) => {
    expect(reportRequestSchema.safeParse({ ...request, ...override }).success).toBe(false)
  })
})

describe('realized cash and outstanding documents', () => {
  it('excludes unpaid invoices and pending expenses from realized movements', () => {
    const report = fixtureReport()
    expect(report.treasury.totalIn).toBe(121)
    expect(report.treasury.totalOut).toBe(24.2)
    expect(report.treasury.periodBalance).toBe(96.8)
    expect(report.treasury.pendingIn).toBe(121)
    expect(report.treasury.pendingOut).toBe(24.2)
    expect(report.treasury.movements.map((m) => m.id)).toEqual(['invoice-a', 'expense-a'])
  })
  it('uses actual payment dates for documents issued in a different month', () => {
    const september = resolveReportPeriod({ ...request, period: 'month', month: 9 })
    const result = buildTreasuryReport(
      'tenant-a',
      september,
      [invoice({ issuedAt: new Date(2026, 0, 1) })],
      [expense({ issuedAt: new Date(2026, 1, 1) })],
      now,
    )
    expect([result.totalIn, result.totalOut]).toEqual([121, 24.2])
    const january = resolveReportPeriod({ ...request, period: 'month', month: 1 })
    expect(
      buildTreasuryReport('tenant-a', january, [invoice()], [expense()], now).movements,
    ).toEqual([])
  })
  it('exports partial receipts once and only the remaining amount as receivable', () => {
    const partial = invoice({
      status: 'partially_paid',
      paidAmount: 40,
      payments: [{ paidAt: new Date(2026, 8, 8), amount: 40, method: 'cash' }],
    })
    const result = buildTreasuryReport('tenant-a', period, [partial], [], now)
    expect(result.totalIn).toBe(40)
    expect(result.pendingIn).toBe(81)
    expect(result.movements).toHaveLength(1)
  })
  it('never converts a future-dated receipt to an undated realized receipt', () => {
    const result = buildTreasuryReport(
      'tenant-a',
      period,
      [invoice({ payments: [{ paidAt: new Date(2026, 11, 1), amount: 121, method: 'card' }] })],
      [],
      now,
    )
    expect(result.totalIn).toBe(0)
  })
  it('keeps older outstanding documents but excludes future documents and other tenants', () => {
    const result = buildTreasuryReport(
      'tenant-a',
      period,
      [
        invoice({ tenantId: 'other' }),
        invoice({ status: 'draft' }),
        invoice({ status: 'cancelled' }),
        invoice({
          id: 'old',
          status: 'sent',
          issuedAt: new Date(2026, 0, 1),
          payments: [],
          paidAmount: 0,
        }),
        invoice({ status: 'sent', issuedAt: new Date(2026, 11, 1), payments: [], paidAmount: 0 }),
      ],
      [expense({ tenantId: 'other' }), expense({ status: 'cancelled' })],
      now,
    )
    expect(result.movements).toEqual([])
    expect(result.receivables.map((m) => m.id)).toEqual(['old'])
  })
  it('discloses an unknown collection date instead of fabricating it', () => {
    const result = buildTreasuryReport('tenant-a', period, [invoice({ payments: [] })], [], now)
    expect(result.movements[0]?.paidAt).toBeNull()
    expect(result.notes.join(' ')).toContain('sin fecha registrada')
    expect(result.openingBalance).toBeNull()
  })
  it('includes both interval endpoints, with cent-accurate totals and no input mutations', () => {
    const rows = [
      expense({ paidAt: period.start, totalAmount: 0.1 }),
      expense({ id: 'end', paidAt: period.end, totalAmount: 0.2 }),
    ]
    const before = structuredClone(rows)
    expect(buildTreasuryReport('tenant-a', period, [], rows, now).totalOut).toBe(0.3)
    expect(rows).toEqual(before)
  })
})

describe('CSV and fiscal consistency', () => {
  it('round-trips Spanish text, separators, quotes, newlines and numeric cells', () => {
    const text = 'José Muñoz; Ferretería López "especial"\nSeguridad Social'
    const csv = encodeCsv([
      ['descripcion', 'importe', 'fecha'],
      [text, 1234.56, '09/09/2026'],
    ])
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain(';1234,56;')
    expect(csv).not.toContain('€')
    const parsed = Papa.parse<string[]>(csv, { delimiter: ';', skipEmptyLines: true })
    expect(parsed.errors).toEqual([])
    expect(parsed.data[1]).toEqual([text, '1234,56', '09/09/2026'])
  })
  it('protects spreadsheet formulas without changing negative numeric values', () => {
    const parsed = Papa.parse<string[]>(
      encodeCsv([['=1+1', '@SUM(A1)', '+command', -25.5, null]]),
      { delimiter: ';', skipEmptyLines: true },
    )
    expect(parsed.data[0]).toEqual(["'=1+1", "'@SUM(A1)", "'+command", '-25,50', ''])
  })
  it('exports a rectangular multi-section CSV matching the UI financial summary', () => {
    const report = fixtureReport()
    const parsed = Papa.parse<Record<string, string>>(reportCsv(report), {
      delimiter: ';',
      header: true,
      skipEmptyLines: true,
    })
    expect(parsed.errors).toEqual([])
    const output = parsed.data.find(
      (row) => row.seccion === 'resumen_financiero' && row.campo_1 === 'Salidas pagadas',
    )
    expect(output?.campo_2).toBe('24,20')
    const html = renderToStaticMarkup(createElement(ReportPreview, { report }))
    expect(html).toContain('Salidas pagadas')
    expect(html).toContain('24,20')
    expect(html).toContain(REPORT_NOTICE)
    expect(report.tables.find((t) => t.key === 'resumen_financiero')?.rows).toContainEqual([
      'Salidas pagadas',
      report.treasury.totalOut,
    ])
  })
  it('preserves original fiscal results and missing data in Modelo 303/130', () => {
    const report = fixtureReport()
    const f = report.fiscal[0]!
    const m303 = report.tables.find((t) => t.key.startsWith('modelo_303'))!
    const m130 = report.tables.find((t) => t.key.startsWith('modelo_130'))!
    expect(m303.rows).toContainEqual(['Resultado estimado', f.modelo303.estimatedResult])
    expect(m303.rows).toContainEqual(['IVA deducible', f.modelo303.deductibleVat])
    expect(m130.rows).toContainEqual([
      'Ingresos acumulados',
      f.modelo130.grossIncome,
      'Desde enero hasta el cierre del trimestre',
    ])
    expect(m130.rows.find((row) => row[0] === 'Resultado estimado del período')?.[1]).toBeNull()
    expect(m130.rows.find((row) => row[0] === 'Minoraciones')?.[1]).toBeNull()
  })
  it('uses identical deductions regardless of payment status and preserves undefined treatment', () => {
    expect(expenseDeductions(expense())).toEqual(
      expenseDeductions(expense({ status: 'pending', paidAt: null })),
    )
    expect(
      expenseDeductions(expense({ vatDeductiblePercent: null, irpfDeductiblePercent: null })),
    ).toMatchObject({ vat: null, irpf: null })
  })
  it('includes all advisor sections as individual UTF-8 CSVs, with no 100-row cap', async () => {
    const report = fixtureReport({
      expenses: Array.from({ length: 125 }, (_, i) => expense({ id: `expense-${i}` })),
    })
    const zip = await JSZip.loadAsync(await reportZip(report))
    for (const key of [
      'resumen_financiero',
      'resumen_fiscal',
      'facturas',
      'gastos',
      'seguridad_social',
      'cuentas_por_cobrar',
      'cuentas_por_pagar',
      'modelo_303_2026_Q3',
      'modelo_130_2026_Q3',
    ]) {
      expect(zip.file(`${key}.csv`)).not.toBeNull()
    }
    const csv = await zip.file('gastos.csv')!.async('string')
    const parsed = Papa.parse<Record<string, string>>(csv, {
      delimiter: ';',
      header: true,
      skipEmptyLines: true,
    })
    expect(parsed.errors).toEqual([])
    expect(parsed.data).toHaveLength(125)
    expect(parsed.data[124]?.proveedor).toBe('Ferretería López')
    expect(parsed.data[0]?.iva_deducible).toBe('2,10')
    expect(await zip.file('informacion.csv')!.async('string')).toContain(REPORT_NOTICE)
  })
})

describe('PDF pagination', () => {
  it('retains every column with stable row references in printable groups', () => {
    for (const table of fixtureReport().tables) {
      const groups = pdfColumnGroups(table)
      expect(new Set(groups.flat()).size).toBe(table.columns.length)
      expect(groups.every((group) => group.length <= 5)).toBe(true)
    }
  })
  it('renders a real multi-page PDF with accented data and long tables', async () => {
    const report = fixtureReport({
      expenses: Array.from({ length: 85 }, (_, i) =>
        expense({
          id: `e-${i}`,
          externalNumber: `T-${i + 1}`,
          description: `Descripción número ${i + 1}: ` + 'Limpieza y mantenimiento. '.repeat(10),
        }),
      ),
    })
    const pdf = await renderToBuffer(
      createElement(ReportPdfDocument, { report }) as ReactElement<DocumentProps>,
    )
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
    expect(pdf.length).toBeGreaterThan(5000)
    if (process.env.NEXO_REPORT_ARTIFACT_DIR) {
      mkdirSync(process.env.NEXO_REPORT_ARTIFACT_DIR, { recursive: true })
      writeFileSync(`${process.env.NEXO_REPORT_ARTIFACT_DIR}/informe-gestor.pdf`, pdf)
      writeFileSync(`${process.env.NEXO_REPORT_ARTIFACT_DIR}/informe-gestor.csv`, reportCsv(report))
    }
  }, 30000)
})

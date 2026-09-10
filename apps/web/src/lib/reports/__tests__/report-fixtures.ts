import { calculateFiscalPeriod } from '@/app/(app)/impuestos/_lib/fiscal-calculation'
import { resolveReportPeriod, type ReportRequest } from '../report-period'
import { buildReportTables } from '../report-tables'
import { buildTreasuryReport } from '../treasury-report'
import type { AccountingReport, ReportExpense, ReportInvoice } from '../report-types'

export const request: ReportRequest = {
  report: 'advisor',
  period: 'quarter',
  year: 2026,
  quarter: 'Q3',
  format: 'pdf',
}
export const now = new Date(2026, 9, 15, 12)
export function invoice(overrides: Partial<ReportInvoice> = {}): ReportInvoice {
  return {
    id: 'invoice-a',
    tenantId: 'tenant-a',
    issuedAt: new Date(2026, 8, 1),
    operationAt: null,
    fullNumber: 'A-2026-001',
    clientName: 'José Muñoz',
    clientNif: '00000000T',
    description: 'Limpieza y mantenimiento',
    status: 'paid',
    subtotal: 100,
    vatAmount: 21,
    totalAmount: 121,
    paidAmount: 121,
    paymentMethod: 'card',
    payments: [{ paidAt: new Date(2026, 8, 8), amount: 121, method: 'card' }],
    ...overrides,
  }
}
export function expense(overrides: Partial<ReportExpense> = {}): ReportExpense {
  return {
    id: 'expense-a',
    tenantId: 'tenant-a',
    issuedAt: new Date(2026, 8, 2),
    paidAt: new Date(2026, 8, 9),
    status: 'paid',
    vendor: 'Ferretería López',
    nif: '',
    description: 'Material; tornillos "especiales"\nBarcelona',
    externalNumber: 'T-001',
    category: 'MATERIAL',
    subtotal: 20,
    vatAmount: 4.2,
    totalAmount: 24.2,
    paymentMethod: 'cash',
    vatDeductiblePercent: 50,
    irpfDeductiblePercent: 100,
    hasVatBreakdown: true,
    ...overrides,
  }
}
export function fixtureReport(overrides: Partial<AccountingReport> = {}): AccountingReport {
  const invoices = overrides.invoices ?? [
    invoice(),
    invoice({
      id: 'pending-invoice',
      fullNumber: 'A-2026-002',
      status: 'sent',
      paidAmount: 0,
      payments: [],
    }),
  ]
  const expenses = overrides.expenses ?? [
    expense(),
    expense({
      id: 'pending-expense',
      externalNumber: 'T-002',
      status: 'pending',
      paidAt: null,
      paymentMethod: null,
    }),
  ]
  const period = overrides.period ?? resolveReportPeriod(request)
  const fiscal = [
    calculateFiscalPeriod({
      tenantId: 'tenant-a',
      year: 2026,
      quarter: 'Q3',
      now,
      invoices: invoices.map((row) => ({ ...row, status: row.status as 'paid' | 'sent' })),
      expenses: expenses.map((row) => ({ ...row, status: row.status as 'paid' | 'pending' })),
    }),
  ]
  const treasury = buildTreasuryReport('tenant-a', period, invoices, expenses, now)
  const report: AccountingReport = {
    kind: 'advisor',
    tenant: { name: 'Superclim Servicios', legalName: 'Titular de ejemplo', nif: '00000000T' },
    period,
    generatedAt: now,
    treasury,
    fiscal,
    invoices,
    expenses,
    tables: [],
    notes: treasury.notes,
    ...overrides,
  }
  report.tables = buildReportTables(report)
  return report
}

import type { FiscalPeriodCalculation } from '@/app/(app)/impuestos/_lib/fiscal-calculation'
import type { ReportKind, ReportPeriod } from './report-period'

export const REPORT_NOTICE =
  'Documento informativo generado por Nexo Billing. No constituye una autoliquidación oficial presentada ante la AEAT.'
export const REPORT_FOOTER = 'Documento informativo generado por Nexo Billing.'
export type ReportCell = string | number | null
export interface ReportTable {
  key: string
  title: string
  columns: string[]
  rows: ReportCell[][]
  note?: string
}
export interface ReportTenant {
  name: string
  legalName: string | null
  nif: string
}
export interface ReportPayment {
  paidAt: Date
  amount: number
  method: string
}
export interface ReportInvoice {
  id: string
  tenantId: string
  issuedAt: Date
  operationAt: Date | null
  fullNumber: string
  clientName: string
  clientNif: string
  description: string
  status: string
  subtotal: number
  vatAmount: number
  totalAmount: number
  paidAmount: number
  paymentMethod: string | null
  payments: ReportPayment[]
}
export interface ReportExpense {
  id: string
  tenantId: string
  issuedAt: Date
  paidAt: Date | null
  status: string
  vendor: string
  nif: string
  description: string
  externalNumber: string | null
  category: string | null
  subtotal: number
  vatAmount: number
  totalAmount: number
  paymentMethod: string | null
  vatDeductiblePercent: number | null
  irpfDeductiblePercent: number | null
  hasVatBreakdown: boolean
}
export interface ReportMovement {
  id: string
  date: Date
  type: 'Entrada' | 'Salida'
  party: string
  description: string
  number: string
  amount: number
  method: string | null
  status: string
  paidAt: Date | null
  dateBasis: string
}
export interface TreasuryReport {
  openingBalance: number | null
  totalIn: number
  totalOut: number
  periodBalance: number
  pendingIn: number
  pendingOut: number
  movements: ReportMovement[]
  receivables: ReportMovement[]
  payables: ReportMovement[]
  notes: string[]
}
export interface AccountingReport {
  kind: ReportKind
  tenant: ReportTenant
  period: ReportPeriod
  generatedAt: Date
  treasury: TreasuryReport
  fiscal: FiscalPeriodCalculation[]
  invoices: ReportInvoice[]
  expenses: ReportExpense[]
  tables: ReportTable[]
  notes: string[]
}

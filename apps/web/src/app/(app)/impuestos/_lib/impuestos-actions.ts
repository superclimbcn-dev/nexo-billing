'use server'

import { createServerClient } from '@nexo/core-auth'
import { prisma } from '@nexo/prisma'
import { redirect } from 'next/navigation'
import {
  calculateFiscalPeriod,
  type FiscalExpenseDocument,
  type FiscalInvoiceDocument,
  type FiscalPeriodCalculation,
  type FiscalWarning,
} from './fiscal-calculation'
import { getCurrentQuarter, getQuarterDates, type Quarter } from './impuestos-schema'

// ── Types ───────────────────────────────────────────────────────────────────

export interface Modelo303Data {
  year: number
  quarter: Quarter
  baseImponible: number
  ivaRepercutido: number
  ivaSoportado: number
  ivaDeducible: number
  ivaNoDeducible: number
  ivaAPagar: number
  deadline: Date
  status: 'pending' | 'submitted' | 'overdue'
}

export interface Modelo130Data {
  year: number
  quarter: Quarter
  rendimientoBruto: number
  gastosDeducibles: number
  rendimientoNeto: number
  /** @deprecated Compatibility alias for irpfAcumuladoTeorico. */
  irpfAPagar: number
  irpfAcumuladoTeorico: number
  estimacionAcumuladaSinAjustes: number
  retenciones: number | null
  pagosAnteriores: number | null
  resultadoEstimadoPeriodo: number | null
  /** @deprecated Compatibility alias; no reliable payable result is available. */
  totalAPagar: number | null
  deadline: Date
  status: 'pending' | 'submitted' | 'overdue'
}

export interface Vencimiento {
  date: Date
  label: string
  model: '303' | '130'
  quarter: Quarter
  year: number
  estimatedAmount: number | null
  status: 'pending' | 'submitted' | 'overdue'
}

export interface ImpuestosPageData {
  m303: Modelo303Data
  m130: Modelo130Data
  vencimientos: Vencimiento[]
  warnings: FiscalWarning[]
  audit: FiscalPeriodCalculation['audit']
}

// ── Auth helper ─────────────────────────────────────────────────────────────

async function requireAuth(): Promise<{ tenantId: string }> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')
  return { tenantId }
}

// ── Central fiscal calculation ──────────────────────────────────────────────

interface FiscalDocuments {
  invoices: FiscalInvoiceDocument[]
  expenses: FiscalExpenseDocument[]
}

export async function getFiscalPeriodCalculation(
  year: number,
  quarter: Quarter,
): Promise<FiscalPeriodCalculation> {
  const { tenantId } = await requireAuth()
  return getFiscalPeriodCalculationForTenant(tenantId, year, quarter)
}

async function getFiscalPeriodCalculationForTenant(
  tenantId: string,
  year: number,
  quarter: Quarter,
): Promise<FiscalPeriodCalculation> {
  const { end } = getQuarterDates(year, quarter)
  const documents = await getFiscalDocumentsForTenant(tenantId, year, end)
  return calculateForDocuments(tenantId, year, quarter, documents)
}

async function getFiscalDocumentsForTenant(
  tenantId: string,
  year: number,
  end: Date,
): Promise<FiscalDocuments> {
  const yearStart = new Date(year, 0, 1)

  const [invoices, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        tenantId,
        issuedAt: { gte: yearStart, lte: end },
      },
      select: {
        id: true,
        tenantId: true,
        issuedAt: true,
        status: true,
        subtotal: true,
        vatAmount: true,
      },
    }),
    prisma.expense.findMany({
      where: {
        tenantId,
        issuedAt: { gte: yearStart, lte: end },
      },
      select: {
        id: true,
        tenantId: true,
        issuedAt: true,
        status: true,
        subtotal: true,
        vatAmount: true,
        vatDeductiblePercent: true,
        irpfDeductiblePercent: true,
        lines: {
          select: { id: true },
          take: 1,
        },
      },
    }),
  ])

  return {
    invoices,
    expenses: expenses.map(({ lines, ...expense }) => ({
      ...expense,
      hasVatBreakdown: lines.length > 0,
    })),
  }
}

function calculateForDocuments(
  tenantId: string,
  year: number,
  quarter: Quarter,
  documents: FiscalDocuments,
): FiscalPeriodCalculation {
  return calculateFiscalPeriod({ tenantId, year, quarter, ...documents })
}

function toModelo303(calculation: FiscalPeriodCalculation): Modelo303Data {
  const { period, modelo303 } = calculation
  return {
    year: period.year,
    quarter: period.quarter,
    baseImponible: modelo303.taxableBase,
    ivaRepercutido: modelo303.outputVat,
    ivaSoportado: modelo303.supportedVat,
    ivaDeducible: modelo303.deductibleVat,
    ivaNoDeducible: modelo303.nonDeductibleVat,
    ivaAPagar: modelo303.estimatedResult,
    deadline: period.deadline,
    status: modelo303.status,
  }
}

function toModelo130(calculation: FiscalPeriodCalculation): Modelo130Data {
  const { period, modelo130 } = calculation
  return {
    year: period.year,
    quarter: period.quarter,
    rendimientoBruto: modelo130.grossIncome,
    gastosDeducibles: modelo130.deductibleExpenses,
    rendimientoNeto: modelo130.netIncome,
    irpfAPagar: modelo130.theoreticalAccruedTax,
    irpfAcumuladoTeorico: modelo130.theoreticalAccruedTax,
    estimacionAcumuladaSinAjustes: modelo130.estimateBeforeAdjustments,
    retenciones: modelo130.withholdings,
    pagosAnteriores: modelo130.previousPayments,
    resultadoEstimadoPeriodo: modelo130.estimatedPeriodResult,
    totalAPagar: modelo130.estimatedPeriodResult,
    deadline: period.deadline,
    status: modelo130.status,
  }
}

// ── Modelo 303 (IVA trimestral) ─────────────────────────────────────────────

export async function getModelo303(year: number, quarter: Quarter): Promise<Modelo303Data> {
  const { tenantId } = await requireAuth()
  return getModelo303ForTenant(tenantId, year, quarter)
}

async function getModelo303ForTenant(
  tenantId: string,
  year: number,
  quarter: Quarter,
): Promise<Modelo303Data> {
  const calculation = await getFiscalPeriodCalculationForTenant(tenantId, year, quarter)
  return toModelo303(calculation)
}

// ── Modelo 130 (IRPF autónomos) ─────────────────────────────────────────────

export async function getModelo130(year: number, quarter: Quarter): Promise<Modelo130Data> {
  const { tenantId } = await requireAuth()
  return getModelo130ForTenant(tenantId, year, quarter)
}

async function getModelo130ForTenant(
  tenantId: string,
  year: number,
  quarter: Quarter,
): Promise<Modelo130Data> {
  const calculation = await getFiscalPeriodCalculationForTenant(tenantId, year, quarter)
  return toModelo130(calculation)
}

// ── Próximos vencimientos ───────────────────────────────────────────────────

export async function getProximosVencimientos(): Promise<Vencimiento[]> {
  const { tenantId } = await requireAuth()
  return getProximosVencimientosForTenant(tenantId)
}

async function getProximosVencimientosForTenant(tenantId: string): Promise<Vencimiento[]> {
  const { year: currentYear, quarter: currentQuarter } = getCurrentQuarter()

  const quarters: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4']
  const currentIdx = quarters.indexOf(currentQuarter)
  const toCalc: Array<{ year: number; quarter: Quarter }> = []

  for (let i = 0; i < 4; i++) {
    const idx = (currentIdx + i) % 4
    const yOffset = Math.floor((currentIdx + i) / 4)
    toCalc.push({ year: currentYear + yOffset, quarter: quarters[idx]! })
  }

  const maxEndByYear = new Map<number, Date>()
  for (const { year, quarter } of toCalc) {
    const { end } = getQuarterDates(year, quarter)
    const currentEnd = maxEndByYear.get(year)
    if (!currentEnd || end > currentEnd) maxEndByYear.set(year, end)
  }

  const documentsByYear = new Map<number, FiscalDocuments>()
  await Promise.all(
    Array.from(maxEndByYear.entries()).map(async ([year, end]) => {
      const documents = await getFiscalDocumentsForTenant(tenantId, year, end)
      documentsByYear.set(year, documents)
    }),
  )

  const results: Vencimiento[] = []

  for (const { year, quarter } of toCalc) {
    const documents = documentsByYear.get(year)
    if (!documents) throw new Error(`Fiscal documents not loaded for year ${year}`)
    const calculation = calculateForDocuments(tenantId, year, quarter, documents)
    const m303 = toModelo303(calculation)
    const m130 = toModelo130(calculation)

    results.push({
      date: m303.deadline,
      label: `Modelo 303 (${quarter})`,
      model: '303',
      quarter,
      year,
      estimatedAmount: m303.ivaAPagar,
      status: m303.status,
    })

    results.push({
      date: m130.deadline,
      label: `Modelo 130 (${quarter})`,
      model: '130',
      quarter,
      year,
      estimatedAmount: m130.resultadoEstimadoPeriodo,
      status: m130.status,
    })
  }

  results.sort((a, b) => a.date.getTime() - b.date.getTime())
  return results
}

// ── Quarterly summary for treasury integration ───────────────────────────────

export async function getQuarterlyTaxEstimate(): Promise<{
  totalTaxes: number
  nextDeadline: Date | null
}> {
  const { tenantId } = await requireAuth()
  const { year, quarter } = getCurrentQuarter()
  const calculation = await getFiscalPeriodCalculationForTenant(tenantId, year, quarter)
  const m303 = toModelo303(calculation)

  // Modelo 130 is excluded until previous payments and withholdings have a
  // reliable source; publishing its YTD amount as a quarterly debt is unsafe.
  const totalTaxes = m303.ivaAPagar
  const nextDeadline = m303.status === 'pending' ? m303.deadline : null

  return { totalTaxes, nextDeadline }
}

export async function getImpuestosPageData(
  year: number,
  quarter: Quarter,
): Promise<ImpuestosPageData> {
  const { tenantId } = await requireAuth()
  const [calculation, vencimientos] = await Promise.all([
    getFiscalPeriodCalculationForTenant(tenantId, year, quarter),
    getProximosVencimientosForTenant(tenantId),
  ])

  return {
    m303: toModelo303(calculation),
    m130: toModelo130(calculation),
    vencimientos,
    warnings: calculation.warnings,
    audit: calculation.audit,
  }
}

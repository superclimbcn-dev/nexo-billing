'use server'

import { prisma } from '@nexo/prisma'
import { createServerClient } from '@nexo/core-auth'
import { redirect } from 'next/navigation'
import {
  getQuarterDates,
  getQuarterDeadline,
  getCurrentQuarter,
  type Quarter,
} from './impuestos-schema'

// ── Types ───────────────────────────────────────────────────────────────────

export interface Modelo303Data {
  year: number
  quarter: Quarter
  baseImponible: number
  ivaRepercutido: number
  ivaSoportado: number
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
  irpfAPagar: number
  retenciones: number
  totalAPagar: number
  deadline: Date
  status: 'pending' | 'submitted' | 'overdue'
}

export interface Vencimiento {
  date: Date
  label: string
  model: '303' | '130'
  quarter: Quarter
  year: number
  estimatedAmount: number
  status: 'pending' | 'submitted' | 'overdue'
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

// ── Modelo 303 (IVA trimestral) ─────────────────────────────────────────────

export async function getModelo303(
  year: number,
  quarter: Quarter,
): Promise<Modelo303Data> {
  const { tenantId } = await requireAuth()
  const { start, end } = getQuarterDates(year, quarter)

  const [invoiceAgg, expenseAgg] = await Promise.all([
    prisma.invoice.aggregate({
      where: {
        tenantId,
        issuedAt: { gte: start, lte: end },
        status: { notIn: ['draft', 'cancelled'] },
      },
      _sum: { subtotal: true, vatAmount: true },
    }),
    prisma.expense.aggregate({
      where: {
        tenantId,
        issuedAt: { gte: start, lte: end },
      },
      _sum: { vatAmount: true },
    }),
  ])

  const baseImponible = Number(invoiceAgg._sum.subtotal ?? 0)
  const ivaRepercutido = Number(invoiceAgg._sum.vatAmount ?? 0)
  const ivaSoportado = Number(expenseAgg._sum.vatAmount ?? 0)
  const ivaAPagar = ivaRepercutido - ivaSoportado

  const deadline = getQuarterDeadline(year, quarter)
  const now = new Date()
  const status: Modelo303Data['status'] =
    now > deadline ? 'overdue' : 'pending'

  return {
    year,
    quarter,
    baseImponible: Math.round(baseImponible * 100) / 100,
    ivaRepercutido: Math.round(ivaRepercutido * 100) / 100,
    ivaSoportado: Math.round(ivaSoportado * 100) / 100,
    ivaAPagar: Math.round(ivaAPagar * 100) / 100,
    deadline,
    status,
  }
}

// ── Modelo 130 (IRPF autónomos) ─────────────────────────────────────────────

export async function getModelo130(
  year: number,
  quarter: Quarter,
): Promise<Modelo130Data> {
  const { tenantId } = await requireAuth()
  const { start, end } = getQuarterDates(year, quarter)

  const [invoiceAgg, expenseAgg] = await Promise.all([
    prisma.invoice.aggregate({
      where: {
        tenantId,
        issuedAt: { gte: start, lte: end },
        status: { notIn: ['draft', 'cancelled'] },
      },
      _sum: { totalAmount: true },
    }),
    prisma.expense.aggregate({
      where: {
        tenantId,
        issuedAt: { gte: start, lte: end },
      },
      _sum: { totalAmount: true },
    }),
  ])

  const rendimientoBruto = Number(invoiceAgg._sum.totalAmount ?? 0)
  const gastosDeducibles = Number(expenseAgg._sum.totalAmount ?? 0)
  const rendimientoNeto = rendimientoBruto - gastosDeducibles
  const irpfAPagar = rendimientoNeto * 0.2
  const retenciones = 0 // TODO: add retention support when invoice lines have irpfRate
  const totalAPagar = irpfAPagar - retenciones

  const deadline = getQuarterDeadline(year, quarter)
  const now = new Date()
  const status: Modelo130Data['status'] =
    now > deadline ? 'overdue' : 'pending'

  return {
    year,
    quarter,
    rendimientoBruto: Math.round(rendimientoBruto * 100) / 100,
    gastosDeducibles: Math.round(gastosDeducibles * 100) / 100,
    rendimientoNeto: Math.round(rendimientoNeto * 100) / 100,
    irpfAPagar: Math.round(irpfAPagar * 100) / 100,
    retenciones: Math.round(retenciones * 100) / 100,
    totalAPagar: Math.round(totalAPagar * 100) / 100,
    deadline,
    status,
  }
}

// ── Próximos vencimientos ───────────────────────────────────────────────────

export async function getProximosVencimientos(): Promise<Vencimiento[]> {
  const { tenantId } = await requireAuth()
  const { year: currentYear, quarter: currentQuarter } = getCurrentQuarter()

  const quarters: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4']
  const currentIdx = quarters.indexOf(currentQuarter)

  // Build next 4 quarters
  const toCalc: Array<{ year: number; quarter: Quarter }> = []
  for (let i = 0; i < 4; i++) {
    const idx = (currentIdx + i) % 4
    const yOffset = Math.floor((currentIdx + i) / 4)
    toCalc.push({ year: currentYear + yOffset, quarter: quarters[idx]! })
  }

  const results: Vencimiento[] = []

  for (const { year, quarter } of toCalc) {
    const [m303, m130] = await Promise.all([
      getModelo303(year, quarter),
      getModelo130(year, quarter),
    ])

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
      estimatedAmount: m130.totalAPagar,
      status: m130.status,
    })
  }

  // Sort by date
  results.sort((a, b) => a.date.getTime() - b.date.getTime())

  return results
}

// ── Quarterly summary for treasury integration ───────────────────────────────

export async function getQuarterlyTaxEstimate(): Promise<{
  totalTaxes: number
  nextDeadline: Date | null
}> {
  const { year, quarter } = getCurrentQuarter()
  const [m303, m130] = await Promise.all([
    getModelo303(year, quarter),
    getModelo130(year, quarter),
  ])

  const totalTaxes = m303.ivaAPagar + m130.totalAPagar
  const nextDeadline = m303.status === 'pending' ? m303.deadline : null

  return { totalTaxes, nextDeadline }
}

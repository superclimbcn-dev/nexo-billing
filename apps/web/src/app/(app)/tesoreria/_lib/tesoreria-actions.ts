'use server'

import { prisma, InvoiceStatus } from '@nexo/prisma'
import { createServerClient } from '@nexo/core-auth'
import { redirect } from 'next/navigation'

// ── Types ───────────────────────────────────────────────────────────────────

export interface CashFlowPoint {
  date: string // ISO date YYYY-MM-DD
  cashIn: number
  cashOut: number
  balance: number
}

export interface PendingInvoice {
  id: string
  fullNumber: string
  clientName: string
  totalAmount: number
  dueAt: Date | null
  daysOverdue: number
}

export interface PendingExpense {
  id: string
  description: string
  totalAmount: number
  issuedAt: Date
  dueAt: Date | null
  category: string | null
}

export interface TreasuryKpi {
  currentBalance: number
  pendingIn: number
  pendingOut: number
  pendingInCount: number
  pendingOutCount: number
}

export interface TreasuryAlert {
  level: 'info' | 'warning' | 'danger'
  message: string
  detail?: string
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

// ── Cash Flow (paid invoices vs expenses) ───────────────────────────────────

export async function getCashFlow(
  months = 6,
): Promise<{ points: CashFlowPoint[]; totalIn: number; totalOut: number }> {
  const { tenantId } = await requireAuth()

  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)

  // Cash in: paid invoices grouped by month (using issuedAt as proxy)
  const paidInvoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      status: 'paid',
      issuedAt: { gte: start },
    },
    select: { issuedAt: true, totalAmount: true },
  })

  // Expenses grouped by month
  const expenses = await prisma.expense.findMany({
    where: {
      tenantId,
      issuedAt: { gte: start },
    },
    select: { issuedAt: true, totalAmount: true },
  })

  // Build monthly buckets
  const points: CashFlowPoint[] = []
  let runningBalance = 0

  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

    const cashIn = paidInvoices
      .filter((inv) => {
        const p = new Date(inv.issuedAt)
        return p.getFullYear() === d.getFullYear() && p.getMonth() === d.getMonth()
      })
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0)

    const cashOut = expenses
      .filter((exp) => {
        const e = new Date(exp.issuedAt)
        return e.getFullYear() === d.getFullYear() && e.getMonth() === d.getMonth()
      })
      .reduce((sum, exp) => sum + Number(exp.totalAmount), 0)

    runningBalance += cashIn - cashOut

    points.push({
      date: key,
      cashIn: Math.round(cashIn * 100) / 100,
      cashOut: Math.round(cashOut * 100) / 100,
      balance: Math.round(runningBalance * 100) / 100,
    })
  }

  const totalIn = points.reduce((s, p) => s + p.cashIn, 0)
  const totalOut = points.reduce((s, p) => s + p.cashOut, 0)

  return { points, totalIn, totalOut }
}

// ── Pending Collections (sent/overdue invoices) ─────────────────────────────

export async function getPendingCollections(): Promise<{
  items: PendingInvoice[]
  total: number
}> {
  const { tenantId } = await requireAuth()

  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      status: { in: ['sent', 'overdue', 'partially_paid'] },
    },
    include: { client: { select: { name: true } } },
    orderBy: { dueAt: 'asc' },
  })

  const now = new Date()
  const items = invoices.map((inv) => {
    const due = inv.dueAt ? new Date(inv.dueAt) : null
    const daysOverdue = due
      ? Math.max(0, Math.floor((now.getTime() - due.getTime()) / 86_400_000))
      : 0
    return {
      id: inv.id,
      fullNumber: inv.fullNumber,
      clientName: inv.client.name,
      totalAmount: Number(inv.totalAmount),
      dueAt: inv.dueAt,
      daysOverdue,
    }
  })

  const total = items.reduce((s, it) => s + it.totalAmount, 0)
  return { items, total }
}

// ── Pending Payments (expenses this month + future) ─────────────────────────

export async function getPendingPayments(): Promise<{
  items: PendingExpense[]
  total: number
}> {
  const { tenantId } = await requireAuth()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const expenses = await prisma.expense.findMany({
    where: {
      tenantId,
      issuedAt: { gte: monthStart },
    },
    orderBy: { issuedAt: 'desc' },
    take: 50,
  })

  const items = expenses.map((exp) => ({
    id: exp.id,
    description: exp.notes || 'Gasto sin descripción',
    totalAmount: Number(exp.totalAmount),
    issuedAt: exp.issuedAt,
    dueAt: exp.dueAt,
    category: exp.category,
  }))

  const total = items.reduce((s, it) => s + it.totalAmount, 0)
  return { items, total }
}

// ── KPIs ────────────────────────────────────────────────────────────────────

export async function getTreasuryKpis(): Promise<TreasuryKpi> {
  const { tenantId } = await requireAuth()

  const [paidInvoices, pendingInvoices, expensesMonth] = await Promise.all([
    prisma.invoice.aggregate({
      where: { tenantId, status: 'paid' },
      _sum: { totalAmount: true },
    }),
    prisma.invoice.aggregate({
      where: {
        tenantId,
        status: { in: ['sent', 'overdue', 'partially_paid'] },
      },
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
    prisma.expense.aggregate({
      where: {
        tenantId,
        issuedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
  ])

  const currentBalance = Number(paidInvoices._sum.totalAmount ?? 0)
  const pendingIn = Number(pendingInvoices._sum.totalAmount ?? 0)
  const pendingOut = Number(expensesMonth._sum.totalAmount ?? 0)

  return {
    currentBalance: Math.round(currentBalance * 100) / 100,
    pendingIn: Math.round(pendingIn * 100) / 100,
    pendingOut: Math.round(pendingOut * 100) / 100,
    pendingInCount: pendingInvoices._count._all,
    pendingOutCount: expensesMonth._count._all,
  }
}

// ── Alerts ──────────────────────────────────────────────────────────────────

export async function getTreasuryAlerts(): Promise<TreasuryAlert[]> {
  const { tenantId } = await requireAuth()

  const [paidInvoices, pendingInvoices, expensesMonth] = await Promise.all([
    prisma.invoice.aggregate({
      where: { tenantId, status: 'paid' },
      _sum: { totalAmount: true },
    }),
    prisma.invoice.aggregate({
      where: {
        tenantId,
        status: { in: ['sent', 'overdue', 'partially_paid'] },
      },
      _sum: { totalAmount: true },
    }),
    prisma.expense.aggregate({
      where: {
        tenantId,
        issuedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { totalAmount: true },
    }),
  ])

  const balance = Number(paidInvoices._sum.totalAmount ?? 0)
  const pendingIn = Number(pendingInvoices._sum.totalAmount ?? 0)
  const pendingOut = Number(expensesMonth._sum.totalAmount ?? 0)

  const alerts: TreasuryAlert[] = []

  if (balance < 0) {
    alerts.push({
      level: 'danger',
      message: 'Saldo acumulado negativo',
      detail: `El saldo acumulado es de ${balance.toFixed(2)} €. Revisa tus cobros pendientes.`,
    })
  }

  if (pendingIn < pendingOut && balance > 0) {
    alerts.push({
      level: 'warning',
      message: 'Gastos superan cobros pendientes',
      detail: `Tienes ${pendingOut.toFixed(2)} € en gastos vs ${pendingIn.toFixed(2)} € por cobrar.`,
    })
  }

  if (balance < 1000 && balance >= 0) {
    alerts.push({
      level: 'warning',
      message: 'Reserva de tesorería baja',
      detail: `Saldo acumulado: ${balance.toFixed(2)} €. Considera acelerar cobros.`,
    })
  }

  if (pendingIn > pendingOut * 2) {
    alerts.push({
      level: 'info',
      message: 'Buena proyección de cobros',
      detail: `Tienes ${pendingIn.toFixed(2)} € por cobrar, el doble de tus gastos actuales.`,
    })
  }

  if (alerts.length === 0) {
    alerts.push({
      level: 'info',
      message: 'Tesorería estable',
      detail: `Saldo acumulado: ${balance.toFixed(2)} €. Sin alertas destacadas.`,
    })
  }

  return alerts
}

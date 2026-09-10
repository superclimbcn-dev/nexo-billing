import 'server-only'
import { createServerClient } from '@nexo/core-auth'
import { prisma, Prisma } from '@nexo/prisma'
import { getFiscalPeriodCalculation } from '@/app/(app)/impuestos/_lib/impuestos-actions'
import { buildTreasuryReport } from './treasury-report'
import { resolveReportPeriod, type ReportRequest } from './report-period'
import { buildReportTables } from './report-tables'
import type { AccountingReport, ReportInvoice, ReportExpense } from './report-types'

export class ReportAccessError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}
export async function requireReportTenant(): Promise<string> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new ReportAccessError(401, 'Inicia sesión para generar informes')
  const tenantId: unknown = user.app_metadata?.tenant_id
  if (typeof tenantId !== 'string' || !tenantId)
    throw new ReportAccessError(403, 'Empresa no disponible')
  const membership = await prisma.user.findFirst({
    where: { id: user.id, tenantId },
    select: { id: true },
  })
  if (!membership) throw new ReportAccessError(403, 'No perteneces a esta empresa')
  return tenantId
}

export async function getAccountingReport(request: ReportRequest): Promise<AccountingReport> {
  const tenantId = await requireReportTenant()
  const period = resolveReportPeriod(request)
  const generatedAt = new Date()
  // Consistent read-only snapshot; no report is persisted or uploaded to storage.
  const [tenant, invoiceRows, expenseRows] = await prisma.$transaction(
    [
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, legalName: true, nif: true },
      }),
      prisma.invoice.findMany({
        where: {
          tenantId,
          OR: [
            { issuedAt: { gte: period.start, lte: period.end } },
            {
              status: { in: ['sent', 'overdue', 'partially_paid'] },
              issuedAt: { lte: period.end },
            },
            {
              payments: {
                some: {
                  tenantId,
                  direction: 'inbound',
                  paidAt: { gte: period.start, lte: period.end },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          tenantId: true,
          issuedAt: true,
          operationAt: true,
          fullNumber: true,
          notes: true,
          status: true,
          subtotal: true,
          vatAmount: true,
          totalAmount: true,
          paidAmount: true,
          paymentMethod: true,
          client: { select: { tenantId: true, name: true, nif: true } },
          payments: {
            where: { tenantId, direction: 'inbound' },
            orderBy: { paidAt: 'asc' },
            select: { paidAt: true, amount: true, method: true },
          },
        },
        orderBy: [{ issuedAt: 'asc' }, { id: 'asc' }],
      }),
      prisma.expense.findMany({
        where: {
          tenantId,
          OR: [
            { issuedAt: { gte: period.start, lte: period.end } },
            { status: 'pending', issuedAt: { lte: period.end } },
            { status: 'paid', paidAt: { gte: period.start, lte: period.end } },
          ],
        },
        select: {
          id: true,
          tenantId: true,
          issuedAt: true,
          paidAt: true,
          status: true,
          vendor: true,
          notes: true,
          externalNumber: true,
          category: true,
          subtotal: true,
          vatAmount: true,
          totalAmount: true,
          paymentMethod: true,
          vatDeductiblePercent: true,
          irpfDeductiblePercent: true,
          supplier: { select: { tenantId: true, name: true, nif: true } },
          lines: { take: 1, select: { id: true } },
        },
        orderBy: [{ issuedAt: 'asc' }, { id: 'asc' }],
      }),
    ],
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  )
  if (!tenant) throw new ReportAccessError(403, 'Empresa no disponible')
  const invoices: ReportInvoice[] = invoiceRows
    .filter((row) => row.tenantId === tenantId)
    .map((row) => ({
      ...row,
      clientName: row.client?.tenantId === tenantId ? row.client.name : 'Consumidor final',
      clientNif: row.client?.tenantId === tenantId ? row.client.nif : '',
      description: row.notes ?? '',
      subtotal: Number(row.subtotal),
      vatAmount: Number(row.vatAmount),
      totalAmount: Number(row.totalAmount),
      paidAmount: Number(row.paidAmount),
      payments: row.payments.map((payment) => ({ ...payment, amount: Number(payment.amount) })),
    }))
  const expenses: ReportExpense[] = expenseRows
    .filter((row) => row.tenantId === tenantId)
    .map((row) => ({
      ...row,
      vendor: row.supplier?.tenantId === tenantId ? row.supplier.name : (row.vendor ?? ''),
      nif: row.supplier?.tenantId === tenantId ? row.supplier.nif : '',
      description: row.notes ?? '',
      subtotal: Number(row.subtotal),
      vatAmount: Number(row.vatAmount),
      totalAmount: Number(row.totalAmount),
      vatDeductiblePercent:
        row.vatDeductiblePercent === null ? null : Number(row.vatDeductiblePercent),
      irpfDeductiblePercent:
        row.irpfDeductiblePercent === null ? null : Number(row.irpfDeductiblePercent),
      hasVatBreakdown: row.lines.length > 0,
    }))
  const fiscal =
    request.report === 'treasury'
      ? []
      : await Promise.all(
          (period.kind === 'year' ? (['Q1', 'Q2', 'Q3', 'Q4'] as const) : [period.quarter]).map(
            (quarter) => getFiscalPeriodCalculation(period.year, quarter),
          ),
        )
  const treasury = buildTreasuryReport(tenantId, period, invoices, expenses, generatedAt)
  const within = (date: Date) => date >= period.start && date <= period.end
  const report: AccountingReport = {
    kind: request.report,
    tenant,
    period,
    generatedAt,
    treasury,
    fiscal,
    invoices: invoices.filter((row) => within(row.issuedAt) && row.status !== 'draft'),
    expenses: expenses.filter((row) => within(row.issuedAt)),
    tables: [],
    notes: request.report === 'tax' ? [] : [...treasury.notes],
  }
  if (fiscal.length)
    report.notes.push(
      'Modelo 303: trimestre completo. Modelo 130: acumulado desde enero hasta el cierre de cada trimestre; sus importes acumulados no se suman entre trimestres.',
    )
  if (request.report === 'advisor')
    report.notes.push(
      'Cuotas de autónomo / Seguridad Social: sin clasificación específica en los datos actuales. No se infieren por proveedor, descripción o categoría; el gestor puede identificarlas en el detalle de gastos.',
    )
  report.tables = buildReportTables(report)
  return report
}

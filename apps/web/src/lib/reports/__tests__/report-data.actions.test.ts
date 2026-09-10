import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAccountingReport, requireReportTenant } from '../report-data'
import { getImpuestosPageData } from '@/app/(app)/impuestos/_lib/impuestos-actions'
import { expense, invoice, request } from './report-fixtures'

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  membership: vi.fn(),
  tenant: vi.fn(),
  invoices: vi.fn(),
  expenses: vi.fn(),
  transaction: vi.fn(),
}))
vi.mock('server-only', () => ({}))
vi.mock('@nexo/core-auth', () => ({
  createServerClient: async () => ({ auth: { getUser: mocks.getUser } }),
}))
vi.mock('@nexo/prisma', async (importOriginal) => {
  const original = await importOriginal<typeof import('@nexo/prisma')>()
  return {
    ...original,
    prisma: {
      user: { findFirst: mocks.membership },
      tenant: { findUnique: mocks.tenant },
      invoice: { findMany: mocks.invoices },
      expense: { findMany: mocks.expenses },
      $transaction: mocks.transaction,
    },
  }
})

beforeEach(() => {
  vi.resetAllMocks()
  mocks.getUser.mockResolvedValue({
    data: { user: { id: 'user-a', app_metadata: { tenant_id: 'tenant-a', role: 'ACCOUNTANT' } } },
  })
  mocks.membership.mockResolvedValue({ id: 'user-a' })
  mocks.tenant.mockResolvedValue({ name: 'Empresa A', legalName: 'Titular A', nif: '00000000T' })
  mocks.invoices.mockResolvedValue([
    {
      ...invoice(),
      notes: 'Factura de prueba',
      client: { tenantId: 'tenant-a', name: 'José', nif: '00000000T' },
    },
  ])
  mocks.expenses.mockResolvedValue([
    { ...expense(), notes: 'Material', supplier: null, lines: [{ id: 'line-a' }] },
  ])
  mocks.transaction.mockImplementation((queries: Promise<unknown>[]) => Promise.all(queries))
})

describe('authenticated, read-only reports', () => {
  it('rejects anonymous requests before accessing company data', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } })
    await expect(getAccountingReport(request)).rejects.toMatchObject({ status: 401 })
    expect(mocks.membership).not.toHaveBeenCalled()
    expect(mocks.transaction).not.toHaveBeenCalled()
  })
  it('rejects stale or foreign company membership', async () => {
    mocks.membership.mockResolvedValue(null)
    await expect(getAccountingReport(request)).rejects.toMatchObject({ status: 403 })
    expect(mocks.membership).toHaveBeenCalledWith({
      where: { id: 'user-a', tenantId: 'tenant-a' },
      select: { id: true },
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })
  it('allows an authenticated company accountant', async () => {
    expect(await requireReportTenant()).toBe('tenant-a')
  })
  it('scopes documents, payments and related parties to the authenticated tenant', async () => {
    const report = await getAccountingReport({ ...request, report: 'treasury' })
    expect(report.tenant.name).toBe('Empresa A')
    for (const [query] of mocks.invoices.mock.calls) expect(query.where.tenantId).toBe('tenant-a')
    for (const [query] of mocks.expenses.mock.calls) expect(query.where.tenantId).toBe('tenant-a')
    expect(mocks.invoices.mock.calls[0]![0].select.payments.where).toEqual({
      tenantId: 'tenant-a',
      direction: 'inbound',
    })
    expect(mocks.transaction.mock.calls[0]![1]).toEqual({ isolationLevel: 'RepeatableRead' })
    expect(mocks.invoices.mock.calls[0]![0].take).toBeUndefined()
    expect(mocks.expenses.mock.calls[0]![0].take).toBeUndefined()
  })
  it('uses precisely the same fiscal values as the Impuestos interface', async () => {
    const report = await getAccountingReport({ ...request, report: 'tax' })
    const ui = await getImpuestosPageData(2026, 'Q3')
    const fiscal = report.fiscal[0]!
    expect(fiscal.modelo303).toMatchObject({
      taxableBase: ui.m303.baseImponible,
      outputVat: ui.m303.ivaRepercutido,
      supportedVat: ui.m303.ivaSoportado,
      deductibleVat: ui.m303.ivaDeducible,
      nonDeductibleVat: ui.m303.ivaNoDeducible,
      estimatedResult: ui.m303.ivaAPagar,
    })
    expect(fiscal.modelo130).toMatchObject({
      grossIncome: ui.m130.rendimientoBruto,
      deductibleExpenses: ui.m130.gastosDeducibles,
      netIncome: ui.m130.rendimientoNeto,
      theoreticalAccruedTax: ui.m130.irpfAcumuladoTeorico,
      withholdings: ui.m130.retenciones,
      previousPayments: ui.m130.pagosAnteriores,
      estimatedPeriodResult: ui.m130.resultadoEstimadoPeriodo,
    })
  })
  it('exports four independent fiscal quarters for an annual advisor report', async () => {
    const report = await getAccountingReport({ ...request, period: 'year' })
    expect(report.fiscal.map((f) => f.period.quarter)).toEqual(['Q1', 'Q2', 'Q3', 'Q4'])
    expect(report.tables.filter((t) => t.key.startsWith('modelo_130'))).toHaveLength(4)
    expect(report.notes.join(' ')).toContain('no se suman')
  })
  it('does not reclassify Seguridad Social based on a supplier name or description', async () => {
    mocks.expenses.mockResolvedValue([
      {
        ...expense({ description: 'Seguridad Social' }),
        notes: 'Seguridad Social',
        supplier: null,
        lines: [{ id: 'line-a' }],
      },
    ])
    const report = await getAccountingReport(request)
    const social = report.tables.find((t) => t.key === 'seguridad_social')!
    expect(social.rows[0]![1]).toBeNull()
    expect(report.expenses[0]?.category).toBe('MATERIAL')
  })
})

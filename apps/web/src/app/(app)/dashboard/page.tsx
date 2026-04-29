import { redirect } from 'next/navigation'
import { createServerClient } from '@nexo/core-auth'
import { prisma } from '@nexo/prisma'
import { KpiCard, Panel } from '@nexo/core-ui'

function formatEur(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const [
    clientCount,
    invoiceCount,
    invoicesThisMonth,
    invoicesLastMonth,
    pendingInvoices,
    recentInvoices,
  ] = await Promise.all([
    prisma.client.count({ where: { tenantId } }),
    prisma.invoice.count({ where: { tenantId } }),
    prisma.invoice.findMany({
      where: { tenantId, issuedAt: { gte: startOfMonth } },
      include: { lines: true },
    }),
    prisma.invoice.findMany({
      where: { tenantId, issuedAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      include: { lines: true },
    }),
    prisma.invoice.count({
      where: { tenantId, status: { in: ['sent', 'overdue'] } },
    }),
    prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { issuedAt: 'desc' },
      take: 5,
      include: { client: { select: { name: true } } },
    }),
  ])

  function invoiceTotal(invoices: typeof invoicesThisMonth): number {
    return invoices.reduce((sum, inv) => {
      const lineTotal = inv.lines.reduce((ls, l) => {
        const base = Number(l.quantity) * Number(l.unitPrice)
        const vat = base * (Number(l.vatRate) / 100)
        return ls + base + vat
      }, 0)
      return sum + lineTotal
    }, 0)
  }

  const revenueThisMonth = invoiceTotal(invoicesThisMonth)
  const revenueLastMonth = invoiceTotal(invoicesLastMonth)
  const revenueDelta =
    revenueLastMonth > 0
      ? (((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100).toFixed(1)
      : null

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">Dashboard</h1>
        <p className="text-sm text-[var(--text-dim)] mt-1">
          {now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Facturado este mes"
          value={formatEur(revenueThisMonth)}
          unit="€"
          featured
          delta={
            revenueDelta !== null
              ? `${Number(revenueDelta) >= 0 ? '↑' : '↓'} ${Math.abs(Number(revenueDelta))}% vs mes anterior`
              : 'Sin datos del mes anterior'
          }
          deltaVariant={
            revenueDelta === null ? 'neutral' : Number(revenueDelta) >= 0 ? 'up' : 'down'
          }
        />
        <KpiCard
          label="Facturas este mes"
          value={String(invoicesThisMonth.length)}
          delta={`${invoiceCount} en total`}
          deltaVariant="neutral"
        />
        <KpiCard
          label="Pendientes de cobro"
          value={String(pendingInvoices)}
          delta={pendingInvoices > 0 ? 'Requieren seguimiento' : 'Todo al día'}
          deltaVariant={pendingInvoices > 0 ? 'down' : 'up'}
        />
        <KpiCard
          label="Clientes"
          value={String(clientCount)}
          delta="Activos en la plataforma"
          deltaVariant="neutral"
        />
      </div>

      <Panel title="Últimas facturas">
        <div className="px-6">
        {recentInvoices.length === 0 ? (
          <p className="text-sm text-[var(--text-subtle)] py-6 text-center">
            Aún no hay facturas. Crea la primera desde{' '}
            <a href="/facturas/nueva" className="text-[var(--accent)] hover:underline">
              Facturas → Nueva
            </a>
            .
          </p>
        ) : (
          <div className="flex flex-col">
            {recentInvoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0"
              >
                <div className="flex flex-col">
                  <span className="text-sm text-[var(--text)]">
                    {inv.fullNumber ?? String(inv.number).padStart(4, '0')}
                  </span>
                  <span className="text-xs text-[var(--text-subtle)]">{inv.client.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-[var(--text-dim)]">
                    {new Date(inv.issuedAt).toLocaleDateString('es-ES')}
                  </span>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      inv.status === 'paid'
                        ? 'bg-[var(--success)]/15 text-[var(--success)]'
                        : inv.status === 'overdue'
                          ? 'bg-[var(--danger)]/15 text-[var(--danger)]'
                          : 'bg-[var(--border)] text-[var(--text-dim)]'
                    }`}
                  >
                    {inv.status === 'paid'
                      ? 'Pagada'
                      : inv.status === 'overdue'
                        ? 'Vencida'
                        : inv.status === 'sent'
                          ? 'Enviada'
                          : 'Borrador'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </Panel>
    </div>
  )
}

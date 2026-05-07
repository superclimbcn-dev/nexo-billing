import { redirect } from 'next/navigation'
import { createServerClient } from '@nexo/core-auth'
import { getDashboardStats } from './_lib/dashboard-queries'
import { StatCard, CurrencyStatCard } from './_components/stat-card'
import { RecentInvoices } from './_components/recent-invoices'
import { syncOverdueInvoices } from '../facturas/[id]/_lib/invoice-status-actions'
import { emitDueInvoices } from '@/lib/recurring/emit-due-invoices'
import { countActiveContracts } from '../recurrentes/_lib/recurring-queries'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  await Promise.all([emitDueInvoices(tenantId), syncOverdueInvoices(tenantId)])
  const stats = await getDashboardStats(tenantId)
  const activeContracts = await countActiveContracts(tenantId)

  const now = new Date()
  const dateLabel = now.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const prevAmount = stats.invoicedLastMonth.amount
  const deltaText =
    prevAmount > 0
      ? (() => {
          const pct = (
            ((stats.invoicedThisMonth.amount - prevAmount) / prevAmount) *
            100
          ).toFixed(1)
          const sign = Number(pct) >= 0 ? '↑' : '↓'
          return `${stats.invoicedThisMonth.count} ${stats.invoicedThisMonth.count === 1 ? 'factura' : 'facturas'} · ${sign}${Math.abs(Number(pct))}% vs mes ant.`
        })()
      : `${stats.invoicedThisMonth.count} ${stats.invoicedThisMonth.count === 1 ? 'factura' : 'facturas'}`

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">Dashboard</h1>
        <p className="text-sm text-[var(--text-dim)] mt-1">{dateLabel}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <CurrencyStatCard
          label="Facturado este mes"
          amount={stats.invoicedThisMonth.amount}
          sublabel={deltaText}
          variant="accent"
        />
        <CurrencyStatCard
          label="Pendiente de cobro"
          amount={stats.pendingCollection.amount}
          count={stats.pendingCollection.count}
        />
        <CurrencyStatCard
          label="Vencidas"
          amount={stats.overdue.amount}
          count={stats.overdue.count}
          variant={stats.overdue.count > 0 ? 'danger' : 'default'}
        />
        <StatCard label="Clientes activos" value={stats.activeClients} />
        <StatCard label="Contratos activos" value={activeContracts} />
        <StatCard label="Productos en catálogo" value={stats.catalogItems} />
      </div>

      <RecentInvoices invoices={stats.recentInvoices} />
    </div>
  )
}

import { formatCurrency, formatDate } from '@nexo/core-utils'
import {
  getCashFlow,
  getPendingCollections,
  getPendingPayments,
  getTreasuryKpis,
  getTreasuryAlerts,
} from './_lib/tesoreria-actions'
import { getQuarterlyTaxEstimate } from '../impuestos/_lib/impuestos-actions'
import { CashFlowChart } from './_components/cash-flow-chart'

export default async function TesoreriaPage() {
  const [{ points, totalIn, totalOut }, pendingCollections, pendingPayments, kpis, alerts, tax] =
    await Promise.all([
      getCashFlow(6),
      getPendingCollections(),
      getPendingPayments(),
      getTreasuryKpis(),
      getTreasuryAlerts(),
      getQuarterlyTaxEstimate(),
    ])

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <header>
        <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">Tesorería</h1>
        <p className="text-sm text-[var(--text-dim)] mt-1">
          Flujo de caja, previsiones y alertas
        </p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Saldo acumulado"
          value={kpis.currentBalance}
          accent="text-[var(--text)]"
        />
        <KpiCard
          label="Por cobrar"
          value={kpis.pendingIn}
          sub={`${kpis.pendingInCount} facturas`}
          accent="text-[var(--success)]"
        />
        <KpiCard
          label="Por pagar (mes)"
          value={kpis.pendingOut}
          sub={`${kpis.pendingOutCount} gastos`}
          accent="text-[var(--danger)]"
        />
        <KpiCard
          label="Impuesto próximo trim."
          value={tax.totalTaxes}
          sub={tax.nextDeadline ? `Vence ${formatDate(tax.nextDeadline)}` : 'Sin vencimiento pendiente'}
          accent="text-[var(--warning)]"
        />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg border ${
                alert.level === 'danger'
                  ? 'bg-[var(--danger)]/10 border-[var(--danger)]/30'
                  : alert.level === 'warning'
                    ? 'bg-[var(--warning)]/10 border-[var(--warning)]/30'
                    : 'bg-[var(--surface)] border-[var(--border)]'
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  alert.level === 'danger'
                    ? 'text-[var(--danger)]'
                    : alert.level === 'warning'
                      ? 'text-[var(--warning)]'
                      : 'text-[var(--text)]'
                }`}
              >
                {alert.level === 'danger' ? '🔴' : alert.level === 'warning' ? '⚠️' : 'ℹ️'} {alert.message}
              </p>
              {alert.detail && (
                <p className="text-xs text-[var(--text-dim)] mt-1">{alert.detail}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <section className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wide">
            Evolución últimos 6 meses
          </h2>
          <div className="flex gap-4 text-xs text-[var(--text-dim)]">
            <span className="text-[var(--success)]">+{formatCurrency(totalIn)} entradas</span>
            <span className="text-[var(--danger)]">-{formatCurrency(totalOut)} salidas</span>
          </div>
        </div>
        <CashFlowChart points={points} />
      </section>

      {/* Two columns: pending in / pending out */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending collections */}
        <section className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <h2 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wide mb-4">
            Próximos cobros
          </h2>
          <p className="text-xs text-[var(--text-dim)] mb-3">
            Total: <span className="font-medium text-[var(--text)]">{formatCurrency(pendingCollections.total)}</span>
          </p>
          <div className="space-y-2">
            {pendingCollections.items.length === 0 ? (
              <p className="text-sm text-[var(--text-dim)]">No hay facturas pendientes de cobro.</p>
            ) : (
              pendingCollections.items.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 rounded-md bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] truncate">
                      {inv.fullNumber}
                    </p>
                    <p className="text-xs text-[var(--text-dim)] truncate">{inv.clientName}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-mono text-[var(--text)]">
                      {formatCurrency(inv.totalAmount)}
                    </p>
                    <p className="text-xs text-[var(--text-dim)]">
                      {inv.dueAt
                        ? `${formatDate(inv.dueAt)}${inv.daysOverdue > 0 ? ` · ${inv.daysOverdue}d venc.` : ''}`
                        : 'Sin vencimiento'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Pending payments */}
        <section className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <h2 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wide mb-4">
            Próximos pagos
          </h2>
          <p className="text-xs text-[var(--text-dim)] mb-3">
            Total: <span className="font-medium text-[var(--text)]">{formatCurrency(pendingPayments.total)}</span>
          </p>
          <div className="space-y-2">
            {pendingPayments.items.length === 0 ? (
              <p className="text-sm text-[var(--text-dim)]">No hay gastos registrados este mes.</p>
            ) : (
              pendingPayments.items.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3 rounded-md bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] truncate">
                      {exp.description}
                    </p>
                    <p className="text-xs text-[var(--text-dim)]">
                      {exp.category ?? 'Sin categoría'} · {formatDate(exp.issuedAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-mono text-[var(--text)]">
                      {formatCurrency(exp.totalAmount)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: number
  sub?: string
  accent: string
}) {
  return (
    <div className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
      <p className="text-xs text-[var(--text-dim)] uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-semibold mt-2 ${accent}`}>{formatCurrency(value)}</p>
      {sub && <p className="text-xs text-[var(--text-dim)] mt-1">{sub}</p>}
    </div>
  )
}

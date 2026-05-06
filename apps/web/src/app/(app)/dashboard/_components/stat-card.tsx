import { formatCurrency } from '@nexo/core-utils'

interface Props {
  label: string
  value: string | number
  sublabel?: string
  variant?: 'default' | 'accent' | 'warning' | 'danger'
}

export function StatCard({ label, value, sublabel, variant = 'default' }: Props) {
  const valueColorClass =
    variant === 'accent'
      ? 'text-[var(--accent)]'
      : variant === 'warning'
        ? 'text-[var(--warning)]'
        : variant === 'danger'
          ? 'text-[var(--danger)]'
          : 'text-[var(--text)]'

  return (
    <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
      <div className="text-xs text-[var(--text-dim)] uppercase tracking-wide font-medium">
        {label}
      </div>
      <div className={`text-2xl font-medium mt-2 ${valueColorClass}`}>{value}</div>
      {sublabel && <div className="text-xs text-[var(--text-dim)] mt-1">{sublabel}</div>}
    </div>
  )
}

export function CurrencyStatCard({
  label,
  amount,
  count,
  sublabel,
  variant = 'default',
}: {
  label: string
  amount: number
  count?: number
  sublabel?: string
  variant?: 'default' | 'accent' | 'warning' | 'danger'
}) {
  const autoSublabel =
    sublabel ??
    (count !== undefined
      ? `${count} ${count === 1 ? 'factura' : 'facturas'}`
      : undefined)

  return (
    <StatCard
      label={label}
      value={formatCurrency(amount)}
      sublabel={autoSublabel}
      variant={variant}
    />
  )
}

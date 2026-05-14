import { cn } from '../primitives/cn'

export interface ComplianceBadgeProps {
  className?: string
  sentCount?: number
  lastError?: boolean
}

export function ComplianceBadge({ className, sentCount = 0, lastError = false }: ComplianceBadgeProps) {
  let statusLabel: string
  let statusColor: string
  let dotClass: string

  if (lastError) {
    statusLabel = 'Error · Requiere atención'
    statusColor = 'text-[var(--danger)]'
    dotClass = 'bg-[var(--danger)]'
  } else if (sentCount > 0) {
    statusLabel = `Activo · ${sentCount} enviado${sentCount === 1 ? '' : 's'}`
    statusColor = 'text-[var(--accent)]'
    dotClass = 'bg-[var(--accent)]'
  } else {
    statusLabel = 'Configurar'
    statusColor = 'text-[var(--text-subtle)]'
    dotClass = 'bg-[var(--text-subtle)]'
  }

  return (
    <div
      className={cn(
        'bg-gradient-to-br from-[rgba(212,255,63,0.1)] to-[rgba(212,255,63,0.02)]',
        'border border-[rgba(212,255,63,0.25)] rounded-[10px] p-2.5 px-3 text-[11px]',
        'flex items-center gap-2',
        className
      )}
    >
      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', dotClass)} />
      <div>
        <div className="font-semibold text-[var(--accent)]">VERI·FACTU</div>
        <div className={cn('text-[var(--text-subtle)]', statusColor)}>{statusLabel}</div>
      </div>
    </div>
  )
}

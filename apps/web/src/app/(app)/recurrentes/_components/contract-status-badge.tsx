const ACTIVE_CONFIG = {
  label: 'Activo',
  cls: 'bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30',
}

const CONFIG: Record<string, { label: string; cls: string }> = {
  ACTIVE: ACTIVE_CONFIG,
  PAUSED: {
    label: 'Pausado',
    cls: 'bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/30',
  },
  CANCELLED: {
    label: 'Cancelado',
    cls: 'bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/30',
  },
  FINISHED: {
    label: 'Finalizado',
    cls: 'bg-[var(--border)] text-[var(--text-dim)] border border-[var(--border)]',
  },
}

export function ContractStatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status] ?? ACTIVE_CONFIG
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

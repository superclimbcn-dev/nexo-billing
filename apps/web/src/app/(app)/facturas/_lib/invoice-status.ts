export const INVOICE_STATUS_LABELS = {
  draft: 'Borrador',
  sent: 'Emitida',
  paid: 'Pagada',
  partially_paid: 'Pago parcial',
  overdue: 'Vencida',
  cancelled: 'Anulada',
  rectified: 'Rectificada',
} as const

export const INVOICE_STATUS_COLORS = {
  draft: 'bg-[var(--surface-raised)] text-[var(--text-dim)] border-[var(--border)]',
  sent: 'bg-[var(--accent)]/20 text-[var(--accent)] border-[var(--accent)]/30',
  paid: 'bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30',
  partially_paid: 'bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30',
  overdue: 'bg-[var(--danger)]/20 text-[var(--danger)] border-[var(--danger)]/30',
  cancelled: 'bg-[var(--surface)] text-[var(--text-subtle)] border-[var(--border)]',
  rectified: 'bg-[var(--surface-raised)] text-[var(--text-subtle)] border-[var(--border)]',
} as const

export type InvoiceStatusKey = keyof typeof INVOICE_STATUS_LABELS

export function getStatusLabel(status: string): string {
  return INVOICE_STATUS_LABELS[status as InvoiceStatusKey] ?? status
}

export function getStatusColor(status: string): string {
  return (
    INVOICE_STATUS_COLORS[status as InvoiceStatusKey] ?? INVOICE_STATUS_COLORS.draft
  )
}

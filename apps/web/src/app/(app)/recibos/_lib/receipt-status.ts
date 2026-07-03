export const RECEIPT_STATUS_LABELS = {
  draft: 'Borrador',
  issued: 'Emitido',
  cancelled: 'Anulado',
} as const

export const RECEIPT_STATUS_COLORS = {
  draft: 'bg-[var(--surface-raised)] text-[var(--text-dim)] border-[var(--border)]',
  issued: 'bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30',
  cancelled: 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/30',
} as const

export type ReceiptStatusKey = keyof typeof RECEIPT_STATUS_LABELS

export function getReceiptStatusLabel(status: string): string {
  return RECEIPT_STATUS_LABELS[status as ReceiptStatusKey] ?? status
}

export function getReceiptStatusColor(status: string): string {
  return RECEIPT_STATUS_COLORS[status as ReceiptStatusKey] ?? RECEIPT_STATUS_COLORS.draft
}

export const QUOTE_STATUS_LABELS = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  expired: 'Expirado',
  converted: 'Convertido',
} as const

export const QUOTE_STATUS_COLORS = {
  draft: 'bg-[var(--surface-raised)] text-[var(--text-dim)] border-[var(--border)]',
  sent: 'bg-[var(--accent)]/20 text-[var(--accent)] border-[var(--accent)]/30',
  accepted: 'bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30',
  rejected: 'bg-[var(--danger)]/20 text-[var(--danger)] border-[var(--danger)]/30',
  expired: 'bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30',
  converted: 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20',
} as const

export type QuoteStatusKey = keyof typeof QUOTE_STATUS_LABELS

export function getQuoteStatusLabel(status: string): string {
  return QUOTE_STATUS_LABELS[status as QuoteStatusKey] ?? status
}

export function getQuoteStatusColor(status: string): string {
  return QUOTE_STATUS_COLORS[status as QuoteStatusKey] ?? QUOTE_STATUS_COLORS.draft
}

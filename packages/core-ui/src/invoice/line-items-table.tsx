import type { ReactNode } from 'react'
import { cn } from '../primitives/cn'

export interface LineItemsTableProps {
  children: ReactNode
  className?: string
}

export function LineItemsTable({ children, className }: LineItemsTableProps) {
  return (
    <div
      className={cn('border border-[var(--border)] rounded-[12px] overflow-hidden', className)}
    >
      <div className="grid gap-2 px-4 py-3 bg-[var(--bg)] border-b border-[var(--border)] [grid-template-columns:3fr_80px_100px_80px_100px_32px] [font-family:var(--font-mono)] text-[10px] uppercase text-[var(--text-subtle)] tracking-[0.06em]">
        <div>Descripción</div>
        <div>Uds.</div>
        <div>Precio</div>
        <div>IVA</div>
        <div>Subtotal</div>
        <div />
      </div>
      {children}
      <div className="px-4 py-3 bg-[var(--bg)] text-[var(--accent)] text-[13px] font-medium text-center cursor-pointer hover:bg-[var(--surface-raised)]">
        + Añadir línea
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'
import { cn } from '../primitives/cn'

export interface LineItemRowProps {
  description: string
  quantity: string
  price: string
  vat: string
  subtotal: ReactNode
  className?: string
}

export function LineItemRow({
  description,
  quantity,
  price,
  vat,
  subtotal,
  className,
}: LineItemRowProps) {
  return (
    <div
      className={cn(
        'grid gap-2 px-4 py-3 border-b border-[var(--border)] items-center last:border-b-0',
        '[grid-template-columns:3fr_80px_100px_80px_100px_32px]',
        className
      )}
    >
      <input
        className="bg-transparent border-0 text-[var(--text)] [font-family:var(--font-sans)] text-[13px] outline-none px-1.5 py-1 rounded focus:bg-[var(--surface-raised)]"
        defaultValue={description}
        readOnly
      />
      <input
        className="bg-transparent border-0 text-[var(--text)] [font-family:var(--font-sans)] text-[13px] outline-none px-1.5 py-1 rounded text-right focus:bg-[var(--surface-raised)]"
        defaultValue={quantity}
        readOnly
      />
      <input
        className="bg-transparent border-0 text-[var(--text)] [font-family:var(--font-sans)] text-[13px] outline-none px-1.5 py-1 rounded text-right focus:bg-[var(--surface-raised)]"
        defaultValue={price}
        readOnly
      />
      <input
        className="bg-transparent border-0 text-[var(--text)] [font-family:var(--font-mono)] text-xs outline-none px-1.5 py-1 rounded text-right focus:bg-[var(--surface-raised)]"
        defaultValue={vat}
        readOnly
      />
      <div className="text-right [font-family:var(--font-serif)] text-base">{subtotal}</div>
      <div className="text-[var(--text-subtle)] text-center cursor-pointer">×</div>
    </div>
  )
}

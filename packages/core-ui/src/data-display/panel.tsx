import type { ReactNode } from 'react'
import { cn } from '../primitives/cn'

export interface PanelProps {
  title?: ReactNode
  headerRight?: ReactNode
  children: ReactNode
  className?: string
}

export function Panel({ title, headerRight, children, className }: PanelProps) {
  return (
    <div
      className={cn(
        'bg-[var(--surface)] border border-[var(--border)] rounded-[16px] overflow-hidden',
        className
      )}
    >
      {(title ?? headerRight) && (
        <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center">
          {title && (
            <div className="text-sm font-semibold flex items-center gap-2.5">{title}</div>
          )}
          {headerRight}
        </div>
      )}
      {children}
    </div>
  )
}

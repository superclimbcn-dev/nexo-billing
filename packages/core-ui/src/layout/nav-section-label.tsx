import type { ReactNode } from 'react'
import { cn } from '../primitives/cn'

export interface NavSectionLabelProps {
  children: ReactNode
  className?: string
}

export function NavSectionLabel({ children, className }: NavSectionLabelProps) {
  return (
    <div
      className={cn(
        '[font-family:var(--font-mono)] text-[10px] text-[var(--text-subtle)] uppercase tracking-[0.08em] px-3.5 pt-3.5 pb-1.5',
        className
      )}
    >
      {children}
    </div>
  )
}

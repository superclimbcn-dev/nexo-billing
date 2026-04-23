import type { ReactNode } from 'react'
import { cn } from '../primitives/cn'

export interface SidebarProps {
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function Sidebar({ children, footer, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'bg-[var(--surface)] border-r border-[var(--border)] p-6 px-4 flex flex-col gap-1',
        className
      )}
    >
      {children}
      {footer && (
        <div className="mt-auto pt-4 border-t border-[var(--border)]">{footer}</div>
      )}
    </aside>
  )
}

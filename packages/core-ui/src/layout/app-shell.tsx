import type { ReactNode } from 'react'
import { cn } from '../primitives/cn'

export interface AppShellProps {
  sidebar: ReactNode
  children: ReactNode
  className?: string
}

export function AppShell({ sidebar, children, className }: AppShellProps) {
  return (
    <div className={cn('grid grid-cols-[240px_1fr] min-h-[calc(100vh-65px)]', className)}>
      {sidebar}
      {children}
    </div>
  )
}

'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../primitives/cn'

export interface ScreenItem {
  label: string
  href: string
}

export interface ScreenSwitcherProps {
  screens: ScreenItem[]
  className?: string
}

export function ScreenSwitcher({ screens, className }: ScreenSwitcherProps) {
  const pathname = usePathname()
  return (
    <div
      className={cn(
        'flex gap-1 bg-[var(--surface)] p-1 rounded-[12px] border border-[var(--border)]',
        className
      )}
    >
      {screens.map((screen) => (
        <Link
          key={screen.href}
          href={screen.href}
          className={cn(
            'bg-transparent text-[var(--text-dim)] px-3.5 py-2 rounded-[8px] text-[13px] font-medium cursor-pointer transition-all duration-150 no-underline',
            'hover:text-[var(--text)]',
            pathname === screen.href && 'bg-[var(--accent)] !text-black font-semibold'
          )}
        >
          {screen.label}
        </Link>
      ))}
    </div>
  )
}

export interface TopBarProps {
  brand?: ReactNode
  switcher?: ReactNode
  meta?: ReactNode
  className?: string
}

export function TopBar({ brand, switcher, meta, className }: TopBarProps) {
  return (
    <div
      className={cn(
        'sticky top-0 z-[100] bg-[rgba(10,10,11,0.85)] backdrop-blur-[24px]',
        'border-b border-[var(--border)] px-8 py-4',
        'flex items-center justify-between gap-6',
        className
      )}
    >
      {brand}
      {switcher}
      {meta}
    </div>
  )
}

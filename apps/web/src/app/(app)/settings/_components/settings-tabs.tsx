'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/settings/datos-fiscales', label: 'Datos fiscales' },
  { href: '/settings/logo', label: 'Logo' },
  { href: '/settings/series', label: 'Series' },
  { href: '/settings/billing', label: 'Facturación' },
  { href: '/settings/email', label: 'Email' },
  { href: '/settings/apariencia', label: 'Apariencia' },
]

export function SettingsTabs() {
  const pathname = usePathname()
  return (
    <nav className="flex gap-1 border-b border-[var(--border)]">
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              active
                ? 'border-[var(--accent)] text-[var(--text)]'
                : 'border-transparent text-[var(--text-dim)] hover:text-[var(--text)]'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}

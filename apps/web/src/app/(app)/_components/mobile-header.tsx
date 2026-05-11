'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export function MobileHeader() {
  const pathname = usePathname()
  const isDashboard = pathname === '/dashboard' || pathname === '/'

  if (isDashboard) return null

  return (
    <div className="sticky top-0 z-40 bg-[var(--bg)]/95 backdrop-blur-sm border-b border-[var(--border)] md:hidden">
      <div className="flex items-center h-12 px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </Link>
      </div>
    </div>
  )
}

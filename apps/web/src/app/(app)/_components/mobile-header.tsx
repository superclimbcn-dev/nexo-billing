'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { MobileMenu } from './mobile-menu'

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="sticky top-0 z-40 bg-[var(--bg)]/95 backdrop-blur-sm border-b border-[var(--border)] md:hidden">
        <div className="flex items-center justify-between h-12 px-4">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-[var(--accent)] text-xs font-mono tracking-widest uppercase">
            Nexo Billing
          </span>
          <div className="w-5" />
        </div>
      </div>

      <MobileMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

'use client'

import { useState } from 'react'
import { ExportModal } from './export-modal'

export function ExportButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center px-5 py-3 rounded-md border border-[var(--border)] text-[var(--text)] text-sm font-semibold hover:bg-[var(--surface-hover)] transition-colors"
      >
        Exportar ZIP
      </button>
      {isOpen && <ExportModal onClose={() => setIsOpen(false)} />}
    </>
  )
}

'use client'

import { useState } from 'react'
import { RectificativaModal } from './rectificativa-modal'

interface Props {
  invoiceId: string
  fullNumber: string
  status: string
  hasRectification: boolean
  originalLines: Array<{
    description: string
    quantity: number
    unitPrice: number
    vatRate: number
  }>
}

export function RectificativaButton({ invoiceId, fullNumber, status, hasRectification, originalLines }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  // Only show for sent/overdue/partially_paid/paid invoices that don't already have a rectification
  const canRectify = ['sent', 'overdue', 'partially_paid', 'paid'].includes(status) && !hasRectification
  if (!canRectify) return null

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-2 border border-[var(--border)] text-[var(--text-dim)] text-sm font-medium rounded-md hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors flex items-center justify-center gap-2"
      >
        <span>↺</span>
        Crear rectificativa
      </button>

      {isOpen && (
        <RectificativaModal
          invoiceId={invoiceId}
          fullNumber={fullNumber}
          originalLines={originalLines}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

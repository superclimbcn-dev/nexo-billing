'use client'

import { useState, useTransition } from 'react'
import { createCheckoutSession } from '@/app/(app)/facturas/_lib/stripe-actions'

interface Props {
  invoiceId: string
  tenantId: string
  disabled?: boolean
}

export function PaymentButton({ invoiceId, tenantId, disabled }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const res = await createCheckoutSession(invoiceId, tenantId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      window.location.href = res.url
    })
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-[var(--danger)] text-center">{error}</p>
      )}
      <button
        onClick={handleClick}
        disabled={disabled || isPending}
        className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-[var(--surface-raised)] text-[var(--text)] font-semibold rounded-xl border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
        {isPending ? 'Redirigiendo a Stripe...' : 'Pagar con tarjeta'}
      </button>
    </div>
  )
}

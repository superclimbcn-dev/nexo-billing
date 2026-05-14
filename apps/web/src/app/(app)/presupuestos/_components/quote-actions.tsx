'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateQuoteStatus, deleteQuoteDraft, convertQuoteToInvoice } from '../_lib/quote-actions'

interface Props {
  quoteId: string
  status: string
  invoiceId?: string
}

type ConfirmKey = 'send' | 'accept' | 'reject' | 'expire' | 'delete' | 'convert' | null

export function QuoteActions({ quoteId, status, invoiceId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmAction, setConfirmAction] = useState<ConfirmKey>(null)
  const [error, setError] = useState<string | null>(null)

  function handleStatusChange(key: NonNullable<ConfirmKey>, newStatus: Parameters<typeof updateQuoteStatus>[1]) {
    setError(null)
    if (confirmAction !== key) {
      setConfirmAction(key)
      setTimeout(() => setConfirmAction(null), 3000)
      return
    }
    startTransition(async () => {
      const res = await updateQuoteStatus(quoteId, newStatus)
      if (!res.ok) {
        setError(res.error)
        setConfirmAction(null)
      } else {
        router.refresh()
        setConfirmAction(null)
      }
    })
  }

  function handleDelete() {
    setError(null)
    if (confirmAction !== 'delete') {
      setConfirmAction('delete')
      setTimeout(() => setConfirmAction(null), 3000)
      return
    }
    startTransition(async () => {
      await deleteQuoteDraft(quoteId)
    })
  }

  function handleConvert() {
    setError(null)
    if (confirmAction !== 'convert') {
      setConfirmAction('convert')
      setTimeout(() => setConfirmAction(null), 3000)
      return
    }
    startTransition(async () => {
      const res = await convertQuoteToInvoice(quoteId)
      if (!res.ok) {
        setError(res.error)
        setConfirmAction(null)
      } else {
        router.push(`/facturas/${res.data.invoiceId}`)
      }
    })
  }

  const btnPrimary =
    'px-3 py-1.5 bg-[var(--accent)] text-[var(--bg)] text-sm font-medium rounded-md hover:bg-[var(--accent-dim)] disabled:opacity-50 transition-colors'
  const btnSecondary =
    'px-3 py-1.5 border border-[var(--border)] text-[var(--text-dim)] text-sm rounded-md hover:bg-[var(--surface-hover)] hover:text-[var(--text)] disabled:opacity-50 transition-colors'
  const btnDanger =
    'px-3 py-1.5 border border-[var(--danger)]/40 text-[var(--danger)] text-sm rounded-md hover:bg-[var(--danger)]/10 disabled:opacity-50 transition-colors'

  return (
    <div className="flex flex-wrap items-start gap-2">
      {error && <p className="w-full text-sm text-[var(--danger)]">{error}</p>}

      {status === 'draft' && (
        <>
          <button
            onClick={() => handleStatusChange('send', 'sent')}
            disabled={isPending}
            className={btnPrimary}
          >
            {confirmAction === 'send' ? '¿Confirmar envío?' : 'Marcar como enviado'}
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className={btnDanger}
          >
            {confirmAction === 'delete' ? '¿Eliminar?' : 'Eliminar'}
          </button>
        </>
      )}

      {status === 'sent' && (
        <>
          <button
            onClick={() => handleStatusChange('accept', 'accepted')}
            disabled={isPending}
            className={btnPrimary}
          >
            {confirmAction === 'accept' ? '¿Confirmar aceptación?' : 'Marcar como aceptado'}
          </button>
          <button
            onClick={() => handleStatusChange('reject', 'rejected')}
            disabled={isPending}
            className={btnSecondary}
          >
            {confirmAction === 'reject' ? '¿Confirmar rechazo?' : 'Rechazado'}
          </button>
          <button
            onClick={() => handleStatusChange('expire', 'expired')}
            disabled={isPending}
            className={btnSecondary}
          >
            {confirmAction === 'expire' ? '¿Marcar expirado?' : 'Expirado'}
          </button>
        </>
      )}

      {status === 'accepted' && (
        <button
          onClick={handleConvert}
          disabled={isPending}
          className="px-4 py-2 bg-[var(--success)] text-white text-sm font-semibold rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5"
        >
          ⚡ {confirmAction === 'convert' ? '¿Convertir ahora?' : 'Convertir a factura'}
        </button>
      )}

      {status === 'converted' && invoiceId && (
        <a
          href={`/facturas/${invoiceId}`}
          className={btnSecondary}
        >
          Ver factura →
        </a>
      )}
    </div>
  )
}

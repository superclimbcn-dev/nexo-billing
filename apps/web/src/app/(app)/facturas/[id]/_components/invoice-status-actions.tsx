'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  markInvoiceAsSent,
  markInvoiceAsPaid,
  cancelInvoice,
  deleteDraftInvoice,
} from '../_lib/invoice-status-actions'

async function sendInvoiceEmail(invoiceId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/facturas/${invoiceId}/email`, { method: 'POST' })
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      return { ok: false, error: data.error ?? 'Error al enviar el email' }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Error de red al enviar el email' }
  }
}

interface Props {
  invoiceId: string
  status: string
}

type Confirm = 'send' | 'markSent' | 'pay' | 'cancel' | 'delete' | null

export function InvoiceStatusActions({ invoiceId, status }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmAction, setConfirmAction] = useState<Confirm>(null)
  const [error, setError] = useState<string | null>(null)

  function handleAction(
    key: NonNullable<Confirm>,
    fn: () => Promise<{ ok: boolean; error?: string }>,
  ) {
    setError(null)
    if (confirmAction !== key) {
      setConfirmAction(key)
      setTimeout(() => setConfirmAction(null), 3000)
      return
    }
    startTransition(async () => {
      const res = await fn()
      if (!res.ok) {
        setError(res.error ?? 'Error desconocido')
        setConfirmAction(null)
      } else {
        router.refresh()
        setConfirmAction(null)
      }
    })
  }

  const btnPrimary =
    'px-3 py-1.5 bg-[var(--accent)] text-[var(--bg)] text-sm font-medium rounded-md hover:bg-[var(--accent-dim)] disabled:opacity-50 transition-colors'
  const btnSecondary =
    'px-3 py-1.5 border border-[var(--border)] text-[var(--text-dim)] text-sm rounded-md hover:bg-[var(--surface-hover)] hover:text-[var(--danger)] disabled:opacity-50 transition-colors'

  return (
    <div className="flex flex-wrap items-start gap-2">
      {error && <p className="w-full text-sm text-[var(--danger)]">{error}</p>}

      {status === 'draft' && (
        <>
          <button
            onClick={() =>
              handleAction('send', async () => {
                const emailRes = await sendInvoiceEmail(invoiceId)
                if (!emailRes.ok) return { ok: false, error: emailRes.error }
                return markInvoiceAsSent(invoiceId)
              })
            }
            disabled={isPending}
            className={btnPrimary}
          >
            {confirmAction === 'send' ? '¿Confirmar envío?' : 'Enviar por email'}
          </button>
          <button
            onClick={() => handleAction('markSent', () => markInvoiceAsSent(invoiceId))}
            disabled={isPending}
            className={btnSecondary}
          >
            {confirmAction === 'markSent' ? '¿Marcar como enviada?' : 'Marcar como enviada'}
          </button>
          <button
            onClick={() => handleAction('delete', () => deleteDraftInvoice(invoiceId))}
            disabled={isPending}
            className={btnSecondary}
          >
            {confirmAction === 'delete' ? '¿Eliminar borrador?' : 'Eliminar borrador'}
          </button>
        </>
      )}

      {(status === 'sent' || status === 'overdue' || status === 'partially_paid') && (
        <>
          <button
            onClick={() => handleAction('pay', () => markInvoiceAsPaid(invoiceId))}
            disabled={isPending}
            className={btnPrimary}
          >
            {confirmAction === 'pay' ? '¿Confirmar pago?' : 'Marcar pagada'}
          </button>
          <button
            onClick={() => handleAction('cancel', () => cancelInvoice(invoiceId))}
            disabled={isPending}
            className={btnSecondary}
          >
            {confirmAction === 'cancel' ? '¿Anular factura?' : 'Anular'}
          </button>
        </>
      )}

      {status === 'paid' && (
        <button
          onClick={() => handleAction('cancel', () => cancelInvoice(invoiceId))}
          disabled={isPending}
          className={btnSecondary}
        >
          {confirmAction === 'cancel' ? '¿Anular factura?' : 'Anular'}
        </button>
      )}
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateReceiptStatus, deleteReceiptDraft } from '../_lib/receipt-actions'

interface Props {
  receiptId: string
  status: string
}

type ConfirmKey = 'issue' | 'cancel' | 'delete' | null

export function ReceiptActions({ receiptId, status }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmAction, setConfirmAction] = useState<ConfirmKey>(null)
  const [error, setError] = useState<string | null>(null)

  function handleStatusChange(key: NonNullable<ConfirmKey>, newStatus: Parameters<typeof updateReceiptStatus>[1]) {
    setError(null)
    if (confirmAction !== key) {
      setConfirmAction(key)
      setTimeout(() => setConfirmAction(null), 3000)
      return
    }
    startTransition(async () => {
      const res = await updateReceiptStatus(receiptId, newStatus)
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
      await deleteReceiptDraft(receiptId)
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
            onClick={() => handleStatusChange('issue', 'issued')}
            disabled={isPending}
            className={btnPrimary}
          >
            {confirmAction === 'issue' ? '¿Confirmar emisión?' : 'Marcar como emitido'}
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

      {status === 'issued' && (
        <button
          onClick={() => handleStatusChange('cancel', 'cancelled')}
          disabled={isPending}
          className={btnSecondary}
        >
          {confirmAction === 'cancel' ? '¿Confirmar anulación?' : 'Anular'}
        </button>
      )}
    </div>
  )
}

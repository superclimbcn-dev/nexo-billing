'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { pauseContract, resumeContract, cancelContract, emitNow } from '../_lib/recurring-actions'

interface Props {
  contractId: string
  status: string
}

export function ContractDetailActions({ contractId, status }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)

  function handleTogglePause() {
    setError(null)
    startTransition(async () => {
      const res = status === 'ACTIVE' ? await pauseContract(contractId) : await resumeContract(contractId)
      if (!res.ok) setError(res.error)
    })
  }

  function handleCancel() {
    if (!confirmCancel) {
      setConfirmCancel(true)
      setTimeout(() => setConfirmCancel(false), 3000)
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await cancelContract(contractId)
      if (!res.ok) setError(res.error)
      else setConfirmCancel(false)
    })
  }

  function handleEmitNow() {
    setError(null)
    startTransition(async () => {
      const res = await emitNow(contractId)
      if (res.ok) {
        router.push(`/facturas/${res.data.invoiceId}`)
      } else {
        setError(res.error)
      }
    })
  }

  const canToggle = status === 'ACTIVE' || status === 'PAUSED'
  const canEmit = status === 'ACTIVE' || status === 'PAUSED'
  const canCancel = status !== 'CANCELLED'

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {error && <span className="text-sm text-[var(--danger)]">{error}</span>}

      {canEmit && (
        <button
          type="button"
          onClick={handleEmitNow}
          disabled={isPending}
          className="px-4 py-2 bg-[var(--accent)] text-[var(--bg)] text-sm font-medium rounded-md hover:bg-[var(--accent-dim)] disabled:opacity-50 transition-colors"
        >
          {isPending ? '...' : '⚡ Emitir ahora'}
        </button>
      )}

      {canToggle && (
        <button
          type="button"
          onClick={handleTogglePause}
          disabled={isPending}
          className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text)] rounded-md hover:bg-[var(--surface-hover)] disabled:opacity-50 transition-colors"
        >
          {status === 'ACTIVE' ? 'Pausar' : 'Reanudar'}
        </button>
      )}

      {canCancel && (
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className={`px-4 py-2 text-sm rounded-md border transition-colors disabled:opacity-50 ${
            confirmCancel
              ? 'bg-[var(--danger)] text-white border-[var(--danger)]'
              : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--danger)] hover:border-[var(--danger)]'
          }`}
        >
          {confirmCancel ? '¿Confirmar cancelación?' : 'Cancelar contrato'}
        </button>
      )}
    </div>
  )
}

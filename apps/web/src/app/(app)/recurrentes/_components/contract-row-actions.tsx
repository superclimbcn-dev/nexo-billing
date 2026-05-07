'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { pauseContract, resumeContract, emitNow } from '../_lib/recurring-actions'

interface Props {
  contractId: string
  status: string
}

export function ContractRowActions({ contractId, status }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleTogglePause() {
    setError(null)
    startTransition(async () => {
      const res = status === 'ACTIVE' ? await pauseContract(contractId) : await resumeContract(contractId)
      if (!res.ok) setError(res.error)
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

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
      <button
        type="button"
        onClick={() => router.push(`/recurrentes/${contractId}`)}
        className="text-sm text-[var(--accent)] hover:underline"
      >
        Ver
      </button>
      {canToggle && (
        <button
          type="button"
          onClick={handleTogglePause}
          disabled={isPending}
          className="text-sm text-[var(--text-dim)] hover:text-[var(--text)] disabled:opacity-50"
        >
          {status === 'ACTIVE' ? 'Pausar' : 'Reanudar'}
        </button>
      )}
      {canEmit && (
        <button
          type="button"
          onClick={handleEmitNow}
          disabled={isPending}
          className="text-sm text-[var(--text-dim)] hover:text-[var(--text)] disabled:opacity-50"
        >
          Emitir
        </button>
      )}
    </div>
  )
}

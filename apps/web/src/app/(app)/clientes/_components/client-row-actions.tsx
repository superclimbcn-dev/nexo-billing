'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { softDeleteClient } from '../_lib/client-actions'

interface ClientRowActionsProps {
  clientId: string
  clientName: string
}

export function ClientRowActions({ clientId, clientName }: ClientRowActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function handleDelete() {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
      return
    }
    startTransition(async () => {
      const res = await softDeleteClient(clientId)
      if (res.ok) {
        router.refresh()
      } else {
        alert(res.error)
      }
    })
  }

  return (
    <div className="flex items-center gap-3 justify-end">
      <button
        onClick={() => router.push(`/clientes/${clientId}`)}
        className="text-sm text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors"
      >
        Ver
      </button>
      <button
        onClick={() => router.push(`/clientes/${clientId}/editar`)}
        className="text-sm text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors"
      >
        Editar
      </button>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className={`text-sm transition-colors disabled:opacity-50 ${
          confirming
            ? 'text-[var(--danger)]'
            : 'text-[var(--text-dim)] hover:text-[var(--danger)]'
        }`}
      >
        {isPending
          ? 'Borrando...'
          : confirming
            ? `¿Borrar "${clientName}"?`
            : 'Borrar'}
      </button>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'

export function EmitPendingButton() {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  function handleEmit() {
    setMessage(null)
    setIsError(false)
    startTransition(async () => {
      try {
        const res = await fetch('/api/recurring/emit', { method: 'POST' })
        const data = (await res.json()) as { emitted?: number; error?: string }
        if (!res.ok) {
          setIsError(true)
          setMessage(data.error ?? 'Error al emitir facturas')
        } else {
          const n = data.emitted ?? 0
          setMessage(n === 0 ? 'No hay facturas pendientes de emitir' : `${n} ${n === 1 ? 'factura emitida' : 'facturas emitidas'}`)
        }
      } catch {
        setIsError(true)
        setMessage('Error de conexión')
      }
    })
  }

  return (
    <div className="flex items-center gap-3">
      {message && (
        <span className={`text-sm ${isError ? 'text-[var(--danger)]' : 'text-[var(--text-dim)]'}`}>
          {message}
        </span>
      )}
      <button
        type="button"
        onClick={handleEmit}
        disabled={isPending}
        className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-sm font-medium rounded-md hover:bg-[var(--surface-hover)] disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Emitiendo...' : '⚡ Emitir pendientes'}
      </button>
    </div>
  )
}

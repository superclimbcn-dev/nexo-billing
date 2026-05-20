'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitToVerifactu, cancelVerifactuInvoice } from '../_lib/verifactu-actions'

interface Props {
  invoiceId: string
  status: string
  hasRecord: boolean
  recordStatus?: string | null
  aeatResponse?: unknown
  verifactuProvider?: string
  verifactuNifRegistered?: boolean
}

export function InvoiceVerifactuActions({
  invoiceId,
  status,
  hasRecord,
  recordStatus,
  aeatResponse,
  verifactuProvider,
  verifactuNifRegistered,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)

  if (verifactuProvider !== 'verifacti' || !verifactuNifRegistered) {
    return (
      <p className="text-xs text-[var(--text-subtle)]">
        🔒 Verifactu se activará cuando confirmemos tu NIF con AEAT.
      </p>
    )
  }

  function handleSubmit() {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const res = await submitToVerifactu(invoiceId)
      if (!res.ok) {
        setError(res.error)
      } else {
        setSuccess(`Enviado a AEAT · CSV: ${res.csv}`)
        router.refresh()
      }
    })
  }

  function handleCancel() {
    setError(null)
    setSuccess(null)
    if (!confirmCancel) {
      setConfirmCancel(true)
      setTimeout(() => setConfirmCancel(false), 3000)
      return
    }
    startTransition(async () => {
      const res = await cancelVerifactuInvoice(invoiceId)
      if (!res.ok) {
        setError(res.error)
        setConfirmCancel(false)
      } else {
        setSuccess(`Anulación enviada a AEAT · CSV: ${res.csv}`)
        router.refresh()
        setConfirmCancel(false)
      }
    })
  }

  const btnPrimary =
    'w-full px-3 py-2 bg-[var(--accent)] text-[var(--bg)] text-sm font-medium rounded-md hover:bg-[var(--accent-dim)] disabled:opacity-50 transition-colors'
  const btnSecondary =
    'w-full px-3 py-2 border border-[var(--border)] text-[var(--text-dim)] text-sm rounded-md hover:bg-[var(--surface-hover)] hover:text-[var(--danger)] disabled:opacity-50 transition-colors'

  const isDraft = status === 'draft'
  const isError = recordStatus === 'error'

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-2 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-md">
          <p className="text-xs text-[var(--danger)]">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-2 bg-[var(--success)]/10 border border-[var(--success)]/30 rounded-md">
          <p className="text-xs text-[var(--success)]">{success}</p>
        </div>
      )}

      {!hasRecord && isDraft && (
        <p className="text-xs text-[var(--text-subtle)]">
          Envía la factura primero para poder registrarla en AEAT.
        </p>
      )}

      {!hasRecord && !isDraft && (
        <button onClick={handleSubmit} disabled={isPending} className={btnPrimary}>
          {isPending ? 'Enviando...' : 'Registrar en AEAT'}
        </button>
      )}

      {hasRecord && !isError && (
        <div className="flex items-center gap-2 text-xs text-[var(--success)]">
          <span>✓</span>
          <span>Registrada en AEAT</span>
        </div>
      )}

      {hasRecord && isError && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-[var(--danger)]">
            <span>⚠</span>
            <span>Error en AEAT — Requiere atención</span>
          </div>
          {aeatResponse != null && (
            <pre className="text-[10px] text-[var(--danger)] bg-[var(--danger)]/5 border border-[var(--danger)]/20 rounded p-2 overflow-auto max-h-32 whitespace-pre-wrap break-all">
              {JSON.stringify(aeatResponse, null, 2)}
            </pre>
          )}
          <button onClick={handleSubmit} disabled={isPending} className={btnPrimary}>
            {isPending ? 'Reenviando...' : 'Reenviar a AEAT'}
          </button>
        </div>
      )}

      {hasRecord && (
        <button onClick={handleCancel} disabled={isPending} className={btnSecondary}>
          {confirmCancel ? '¿Confirmar anulación AEAT?' : 'Anular en AEAT'}
        </button>
      )}
    </div>
  )
}

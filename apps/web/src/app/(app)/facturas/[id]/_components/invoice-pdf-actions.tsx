'use client'

import { useState, useTransition } from 'react'
import { signInvoiceTokenAction } from '../_lib/share-actions'

interface Props {
  invoiceId: string
  fullNumber: string
}

export function InvoicePdfActions({ invoiceId, fullNumber }: Props) {
  const [publicLink, setPublicLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDownload() {
    window.open(`/api/facturas/${invoiceId}/pdf`, '_blank')
  }

  function handleGetPublicLink() {
    setError(null)
    startTransition(async () => {
      try {
        const { token } = await signInvoiceTokenAction(invoiceId)
        const url = `${window.location.origin}/f/${token}`
        setPublicLink(url)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error generando enlace')
      }
    })
  }

  async function handleCopy() {
    if (!publicLink) return
    try {
      await navigator.clipboard.writeText(publicLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('No se pudo copiar al portapapeles')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleDownload}
          className="px-3 py-1.5 bg-[var(--accent)] text-[var(--bg)] text-sm font-medium rounded-md hover:bg-[var(--accent-dim)] transition-colors"
        >
          Descargar PDF
        </button>
        <button
          onClick={handleGetPublicLink}
          disabled={isPending}
          className="px-3 py-1.5 border border-[var(--border)] text-sm rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-dim)] hover:text-[var(--text)] disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Generando...' : 'Enlace público'}
        </button>
      </div>

      {error && (
        <div className="text-sm text-[var(--danger)]">{error}</div>
      )}

      {publicLink && (
        <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-2">
          <p className="text-xs text-[var(--text-dim)]">
            Válido 30 días · {fullNumber}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono truncate text-[var(--text)]">
              {publicLink}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 px-2 py-1 text-xs bg-[var(--surface-raised)] border border-[var(--border)] rounded hover:bg-[var(--surface-hover)] transition-colors"
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

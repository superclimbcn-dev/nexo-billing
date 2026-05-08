'use client'

import { useState, useTransition, useRef } from 'react'
import { signInvoiceTokenAction } from '../_lib/share-actions'

interface Props {
  invoiceId: string
  fullNumber: string
  totalAmount: number
  clientEmail: string | null
}

export function InvoicePdfActions({ invoiceId, fullNumber, totalAmount, clientEmail }: Props) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [loadingAction, setLoadingAction] = useState<'wa' | 'email' | 'copy' | null>(null)
  const [isPending, startTransition] = useTransition()
  const cachedLinkRef = useRef<string | null>(null)

  async function getOrGeneratePublicLink(): Promise<string> {
    if (cachedLinkRef.current) return cachedLinkRef.current
    const { token } = await signInvoiceTokenAction(invoiceId)
    const url = `${window.location.origin}/f/${token}`
    cachedLinkRef.current = url
    return url
  }

  function buildMessage(link: string): string {
    const total = totalAmount.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return `Hola, te adjunto la factura ${fullNumber} por importe de ${total} €.\nPuedes verla y descargarla aquí: ${link}`
  }

  function handleDownload() {
    window.open(`/api/facturas/${invoiceId}/pdf`, '_blank')
  }

  function handleWhatsApp() {
    setError(null)
    setLoadingAction('wa')
    startTransition(async () => {
      try {
        const link = await getOrGeneratePublicLink()
        window.open(
          `https://wa.me/?text=${encodeURIComponent(buildMessage(link))}`,
          '_blank',
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al abrir WhatsApp')
      } finally {
        setLoadingAction(null)
      }
    })
  }

  async function handleEmail() {
    setError(null)
    setEmailSent(false)
    setLoadingAction('email')
    try {
      const res = await fetch(`/api/facturas/${invoiceId}/email`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar el email')
      }
      setEmailSent(true)
      setTimeout(() => setEmailSent(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el email')
    } finally {
      setLoadingAction(null)
    }
  }

  function handleShare() {
    setError(null)
    setLoadingAction('copy')
    startTransition(async () => {
      try {
        const link = await getOrGeneratePublicLink()
        if (navigator.share) {
          await navigator.share({
            title: `Factura ${fullNumber}`,
            text: buildMessage(link),
            url: link,
          })
        } else {
          await navigator.clipboard.writeText(link)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'Error al compartir')
        }
      } finally {
        setLoadingAction(null)
      }
    })
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
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleWhatsApp}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] text-sm rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-dim)] hover:text-[var(--text)] disabled:opacity-50 transition-colors"
        >
          <WhatsAppIcon />
          {loadingAction === 'wa' ? '…' : 'WhatsApp'}
        </button>

        <button
          onClick={handleEmail}
          disabled={isPending || loadingAction === 'email'}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] text-sm rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-dim)] hover:text-[var(--text)] disabled:opacity-50 transition-colors"
        >
          <MailIcon />
          {loadingAction === 'email' ? 'Enviando…' : emailSent ? '¡Enviado!' : 'Email'}
        </button>

        <button
          onClick={handleShare}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] text-sm rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-dim)] hover:text-[var(--text)] disabled:opacity-50 transition-colors"
        >
          {copied ? <CheckIcon /> : <LinkIcon />}
          {loadingAction === 'copy' ? '…' : copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4 shrink-0 text-[#25D366]"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 shrink-0"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 shrink-0"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 shrink-0"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

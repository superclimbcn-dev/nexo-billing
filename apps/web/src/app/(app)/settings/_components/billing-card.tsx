'use client'

import { useState, useTransition } from 'react'
import { formatCurrency, formatDate } from '@nexo/core-utils'
import {
  createGoCardlessMandate,
  cancelGoCardlessSubscription,
} from '../_lib/gocardless-actions'

interface Props {
  tenant: {
    subscriptionStatus: string | null
    subscriptionExpiresAt: Date | null
    goCardlessMandateId: string | null
    goCardlessCustomerId: string | null
  }
}

export function BillingCard({ tenant }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

  const status = tenant.subscriptionStatus ?? 'EXPIRED'
  const hasMandate = !!tenant.goCardlessMandateId
  const isActive = status === 'ACTIVE'
  const isPendingStatus = status === 'PENDING'
  const isCancelled = status === 'CANCELLED'
  const isExpired = status === 'EXPIRED'

  function handleActivate() {
    setError(null)
    startTransition(async () => {
      const res = await createGoCardlessMandate()
      if (!res.ok) {
        setError(res.error)
      } else {
        setRedirectUrl(res.data.redirectUrl)
        window.location.href = res.data.redirectUrl
      }
    })
  }

  function handleCancel() {
    if (!confirm('¿Cancelar tu suscripción? Tendrás acceso durante 7 días más.')) {
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await cancelGoCardlessSubscription()
      if (!res.ok) {
        setError(res.error)
      }
    })
  }

  // ── Estado 1: Sem mandate (novo) ───────────────────────────────────────────
  if (!hasMandate && !isActive && !isPendingStatus) {
    return (
      <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💳</span>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">
              Suscripción Profesional
            </h2>
            <p className="text-sm text-[var(--text-dim)]">
              39€/mes · Facturas ilimitadas · 1 contable
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--text-dim)]" />
          <span className="text-[var(--text-dim)]">Estado: Inactivo</span>
        </div>

        {error && (
          <div className="p-3 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-md">
            <p className="text-sm text-[var(--danger)]">{error}</p>
          </div>
        )}

        <button
          onClick={handleActivate}
          disabled={isPending}
          className="w-full px-4 py-3 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md hover:bg-[var(--accent-dim)] disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Procesando...' : 'Activar SEPA (GoCardless)'}
        </button>
        <p className="text-xs text-[var(--text-dim)] text-center">
          Débito directo mensual · IBAN requerido
        </p>
      </div>
    )
  }

  // ── Estado 2: Mandate pendente ─────────────────────────────────────────────
  if (isPendingStatus && !hasMandate) {
    return (
      <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⏳</span>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">
              Autorización pendiente
            </h2>
          </div>
        </div>

        <p className="text-sm text-[var(--text)]">
          Completa la autorización en tu banco para activar el débito directo SEPA.
        </p>

        {redirectUrl && (
          <a
            href={redirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-4 py-3 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md text-center hover:bg-[var(--accent-dim)] transition-colors"
          >
            Ir al banco →
          </a>
        )}

        <p className="text-xs text-[var(--text-dim)]">
          Volverás automáticamente tras autorizar.
        </p>
      </div>
    )
  }

  // ── Estado 3: Activo ───────────────────────────────────────────────────────
  if (isActive) {
    return (
      <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">
              Suscripción activa
            </h2>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-dim)]">Próxima cobranza:</span>
            <span className="text-[var(--text)] font-medium">
              {formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))} — {formatCurrency(39)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-dim)]">Método:</span>
            <span className="text-[var(--text)]">SEPA Direct Debit (GoCardless)</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-md">
            <p className="text-sm text-[var(--danger)]">{error}</p>
          </div>
        )}

        <button
          onClick={handleCancel}
          disabled={isPending}
          className="w-full px-4 py-2 border border-[var(--border)] text-[var(--text-dim)] rounded-md hover:bg-[var(--surface-hover)] disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Cancelando...' : 'Cancelar suscripción'}
        </button>
      </div>
    )
  }

  // ── Estado 4: Cancelado / Expirado ─────────────────────────────────────────
  return (
    <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">❌</span>
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">
            Suscripción cancelada
          </h2>
        </div>
      </div>

      {tenant.subscriptionExpiresAt && (
        <p className="text-sm text-[var(--text)]">
          Acceso termina en:{' '}
          <span className="font-medium">
            {formatDate(tenant.subscriptionExpiresAt)}
          </span>
          {tenant.subscriptionExpiresAt > new Date() && (
            <span className="text-[var(--text-dim)]">
              {' '}
              ({Math.ceil((tenant.subscriptionExpiresAt.getTime() - Date.now()) / 86_400_000)} días)
            </span>
          )}
        </p>
      )}

      {error && (
        <div className="p-3 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-md">
          <p className="text-sm text-[var(--danger)]">{error}</p>
        </div>
      )}

      <button
        onClick={handleActivate}
        disabled={isPending}
        className="w-full px-4 py-3 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md hover:bg-[var(--accent-dim)] disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Procesando...' : 'Reactivar suscripción'}
      </button>
    </div>
  )
}

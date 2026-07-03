'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { calculateInvoiceTotals } from '../../facturas/_lib/invoice-totals'
import { createReceiptDraft } from '../_lib/receipt-actions'
import { ClientAutocomplete } from '../../facturas/_components/client-autocomplete'
import { InvoiceLinesSection } from '../../facturas/_components/invoice-lines-section'
import { InvoiceTotalsSummary } from '../../facturas/_components/invoice-totals-summary'
import type { InvoiceLineState } from '../../facturas/_components/invoice-form'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function newEmptyLine(): InvoiceLineState {
  return {
    tempId: crypto.randomUUID(),
    itemId: null,
    description: '',
    quantity: 1,
    unit: '',
    unitPrice: 0,
    vatRate: 21,
  }
}

function toNum(v: number | string): number {
  if (typeof v === 'number') return v
  return parseFloat(v.replace(',', '.')) || 0
}

const inputClass =
  'w-full px-3 py-2 bg-[var(--surface-raised)] border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors'

export function ReceiptForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [clientId, setClientId] = useState<string | null>(null)
  const [clientLabel, setClientLabel] = useState('')
  const [issuedAt, setIssuedAt] = useState(todayISO())
  const [notes, setNotes] = useState('')
  const [termsConditions, setTermsConditions] = useState('')
  const [lines, setLines] = useState<InvoiceLineState[]>([newEmptyLine()])
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  const totals = useMemo(
    () =>
      calculateInvoiceTotals(
        lines.map((l) => ({
          quantity: toNum(l.quantity),
          unitPrice: toNum(l.unitPrice),
          vatRate: toNum(l.vatRate),
        })),
      ),
    [lines],
  )

  function addLine() {
    setLines((prev) => [...prev, newEmptyLine()])
  }

  function updateLine(tempId: string, patch: Partial<InvoiceLineState>) {
    setLines((prev) => prev.map((l) => (l.tempId === tempId ? { ...l, ...patch } : l)))
  }

  function removeLine(tempId: string) {
    setLines((prev) => prev.filter((l) => l.tempId !== tempId))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setGeneralError(null)

    if (!clientId) {
      setGeneralError('Selecciona un cliente para continuar')
      return
    }

    const payload = {
      clientId,
      issuedAt,
      notes,
      termsConditions,
      lines: lines.map(({ tempId: _t, unit: _u, ...rest }) => rest),
    }

    startTransition(async () => {
      const res = await createReceiptDraft(payload)
      if (res.ok) {
        router.push(`/recibos/${res.data.id}`)
        router.refresh()
      } else {
        setGeneralError(res.error)
        if (res.fieldErrors) setErrors(res.fieldErrors)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {generalError && (
          <div className="p-3 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-md text-[var(--danger)] text-sm">
            {generalError}
          </div>
        )}

        <section className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-4">
          <h2 className="text-lg font-medium text-[var(--text)]">Datos del recibo</h2>

          <ClientAutocomplete
            value={clientId}
            label={clientLabel}
            onChange={(id, lbl) => {
              setClientId(id)
              setClientLabel(lbl)
            }}
          />

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                Fecha de emisión *
              </label>
              <input
                type="date"
                value={issuedAt}
                onChange={(e) => setIssuedAt(e.target.value)}
                className={inputClass}
              />
              {errors.issuedAt && (
                <p className="text-xs text-[var(--danger)] mt-1">{errors.issuedAt[0]}</p>
              )}
            </div>
          </div>
        </section>

        <InvoiceLinesSection
          lines={lines}
          onAdd={addLine}
          onUpdate={updateLine}
          onRemove={removeLine}
        />

        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">
            Notas (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Observaciones o información adicional..."
            className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">
            Términos y condiciones (opcional)
          </label>
          <textarea
            value={termsConditions}
            onChange={(e) => setTermsConditions(e.target.value)}
            rows={3}
            placeholder="Condiciones del servicio..."
            className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="lg:sticky lg:top-6 space-y-4">
          <InvoiceTotalsSummary totals={totals} />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md hover:bg-[var(--accent-dim)] disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Guardando...' : 'Guardar recibo'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/recibos')}
              className="px-4 py-2 border border-[var(--border)] rounded-md text-[var(--text-dim)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

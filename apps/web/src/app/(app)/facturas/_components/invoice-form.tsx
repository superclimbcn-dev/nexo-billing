'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { calculateInvoiceTotals } from '../_lib/invoice-totals'
import { createInvoiceDraft } from '../_lib/invoice-actions'
import { InvoiceHeaderSection } from './invoice-header-section'
import { InvoiceLinesSection } from './invoice-lines-section'
import { InvoiceTotalsSummary } from './invoice-totals-summary'

export interface SeriesOption {
  id: string
  code: string
  name: string
  nextNumber: number
}

export interface InvoiceLineState {
  tempId: string
  itemId: string | null
  description: string
  quantity: number | string
  unit: string
  unitPrice: number | string
  vatRate: number | string
}

interface InvoiceFormProps {
  series: SeriesOption[]
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function in30DaysISO() {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
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

export function InvoiceForm({ series }: InvoiceFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [clientId, setClientId] = useState<string | null>(null)
  const [clientLabel, setClientLabel] = useState('')
  const [seriesId, setSeriesId] = useState(series[0]?.id ?? '')
  const [issuedAt, setIssuedAt] = useState(todayISO())
  const [dueAt, setDueAt] = useState(in30DaysISO())
  const [notes, setNotes] = useState('')
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
      seriesId,
      issuedAt,
      dueAt: dueAt || null,
      notes,
      lines: lines.map(({ tempId: _t, unit: _u, ...rest }) => rest),
    }

    startTransition(async () => {
      const res = await createInvoiceDraft(payload)
      if (res.ok) {
        router.push('/facturas')
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

        <InvoiceHeaderSection
          clientId={clientId}
          clientLabel={clientLabel}
          onClientChange={(id, lbl) => {
            setClientId(id)
            setClientLabel(lbl)
          }}
          seriesId={seriesId}
          seriesOptions={series}
          onSeriesChange={setSeriesId}
          issuedAt={issuedAt}
          onIssuedAtChange={setIssuedAt}
          dueAt={dueAt}
          onDueAtChange={setDueAt}
          errors={errors}
        />

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
            placeholder="Notas internas o información para el cliente..."
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
              {isPending ? 'Guardando...' : 'Guardar borrador'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/facturas')}
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

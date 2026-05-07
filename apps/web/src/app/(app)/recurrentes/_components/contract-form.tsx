'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ClientAutocomplete } from '../../facturas/_components/client-autocomplete'
import { InvoiceLinesSection } from '../../facturas/_components/invoice-lines-section'
import { InvoiceTotalsSummary } from '../../facturas/_components/invoice-totals-summary'
import type { InvoiceLineState } from '../../facturas/_components/invoice-form'
import { calculateInvoiceTotals } from '../../facturas/_lib/invoice-totals'
import { createContract, updateContract } from '../_lib/recurring-actions'
import { FREQUENCY_OPTIONS } from '../_lib/recurring-schema'

interface SeriesOption {
  code: string
  name: string
}

interface ContractFormProps {
  mode: 'create' | 'edit'
  contractId?: string
  seriesOptions: SeriesOption[]
  initialData?: {
    clientId: string
    clientLabel: string
    name: string
    frequency: string
    startDate: string
    endDate: string
    seriesCode: string
    notes: string
    lines: InvoiceLineState[]
  }
}

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
  return parseFloat(String(v).replace(',', '.')) || 0
}

export function ContractForm({ mode, contractId, seriesOptions, initialData }: ContractFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [clientId, setClientId] = useState(initialData?.clientId ?? null)
  const [clientLabel, setClientLabel] = useState(initialData?.clientLabel ?? '')
  const [name, setName] = useState(initialData?.name ?? '')
  const [frequency, setFrequency] = useState(initialData?.frequency ?? 'MONTHLY')
  const [startDate, setStartDate] = useState(initialData?.startDate ?? todayISO())
  const [endDate, setEndDate] = useState(initialData?.endDate ?? '')
  const [seriesCode, setSeriesCode] = useState(
    initialData?.seriesCode ?? seriesOptions[0]?.code ?? '',
  )
  const [notes, setNotes] = useState(initialData?.notes ?? '')
  const [lines, setLines] = useState<InvoiceLineState[]>(
    initialData?.lines ?? [newEmptyLine()],
  )
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
      name,
      frequency,
      startDate,
      endDate: endDate || null,
      seriesCode,
      notes,
      lines: lines.map(({ tempId: _t, unit: _u, ...rest }) => rest),
    }

    startTransition(async () => {
      const res =
        mode === 'create'
          ? await createContract(payload)
          : await updateContract(contractId!, payload)

      if (res.ok) {
        router.push(`/recurrentes/${res.data.id}`)
        router.refresh()
      } else {
        setGeneralError(res.error)
        if (res.fieldErrors) setErrors(res.fieldErrors)
      }
    })
  }

  const inputClass =
    'w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] transition-colors'

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {generalError && (
          <div className="p-3 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-md text-[var(--danger)] text-sm">
            {generalError}
          </div>
        )}

        {/* Client + name */}
        <section className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-4">
          <ClientAutocomplete
            value={clientId}
            label={clientLabel}
            onChange={(id, lbl) => {
              setClientId(id)
              setClientLabel(lbl)
            }}
          />
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              Nombre del contrato *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Limpieza mensual Oficinas X"
              className={inputClass}
            />
            {errors.name && <p className="mt-1 text-sm text-[var(--danger)]">{errors.name[0]}</p>}
          </div>
        </section>

        {/* Frequency + dates + series */}
        <section className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                Frecuencia *
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className={inputClass}
              >
                {FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">Serie *</label>
              <select
                value={seriesCode}
                onChange={(e) => setSeriesCode(e.target.value)}
                className={inputClass}
              >
                {seriesOptions.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
              {errors.seriesCode && (
                <p className="mt-1 text-sm text-[var(--danger)]">{errors.seriesCode[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                Fecha inicio *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-[var(--danger)]">{errors.startDate[0]}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                Fecha fin (opcional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
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
            placeholder="Notas para las facturas generadas..."
            className={inputClass}
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
              {isPending
                ? 'Guardando...'
                : mode === 'create'
                  ? 'Crear contrato'
                  : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/recurrentes')}
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

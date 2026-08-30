'use client'

import { useState } from 'react'
import { InvoiceForm, type SeriesOption } from './invoice-form'
import { SimplifiedInvoiceForm } from './simplified-invoice-form'

interface InvoiceCreateFormProps {
  series: SeriesOption[]
}

type InvoiceKind = 'complete' | 'simplified'

export function InvoiceCreateForm({ series }: InvoiceCreateFormProps) {
  const [kind, setKind] = useState<InvoiceKind>(series.length > 0 ? 'complete' : 'simplified')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Tipo de factura">
        <button
          type="button"
          role="radio"
          aria-checked={kind === 'complete'}
          disabled={series.length === 0}
          onClick={() => setKind('complete')}
          className={`rounded-lg border p-4 text-left transition-colors ${
            kind === 'complete'
              ? 'border-[var(--accent)] bg-[var(--accent)]/10'
              : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <span className="block font-medium text-[var(--text)]">Factura completa (F1)</span>
          <span className="mt-1 block text-sm text-[var(--text-dim)]">
            Con cliente identificado y líneas detalladas. Se guarda como borrador.
          </span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={kind === 'simplified'}
          onClick={() => setKind('simplified')}
          className={`rounded-lg border p-4 text-left transition-colors ${
            kind === 'simplified'
              ? 'border-[var(--accent)] bg-[var(--accent)]/10'
              : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <span className="block font-medium text-[var(--text)]">Factura simplificada (F2)</span>
          <span className="mt-1 block text-sm text-[var(--text-dim)]">
            Para una única operación ya cobrada, sin cliente obligatorio.
          </span>
        </button>
      </div>

      {kind === 'complete' ? (
        series.length > 0 ? (
          <InvoiceForm series={series} />
        ) : (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--text-dim)]">
            No hay series de factura completa activas. Puedes emitir una factura simplificada o contactar con soporte.
          </div>
        )
      ) : (
        <SimplifiedInvoiceForm />
      )}
    </div>
  )
}

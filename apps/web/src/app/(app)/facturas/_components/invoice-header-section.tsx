'use client'

import { ClientAutocomplete } from './client-autocomplete'
import type { SeriesOption } from './invoice-form'

interface Props {
  clientId: string | null
  clientLabel: string
  onClientChange: (id: string, label: string) => void
  seriesId: string
  seriesOptions: SeriesOption[]
  onSeriesChange: (id: string) => void
  issuedAt: string
  onIssuedAtChange: (v: string) => void
  dueAt: string
  onDueAtChange: (v: string) => void
  errors: Record<string, string[]>
}

export function InvoiceHeaderSection({
  clientId,
  clientLabel,
  onClientChange,
  seriesId,
  seriesOptions,
  onSeriesChange,
  issuedAt,
  onIssuedAtChange,
  dueAt,
  onDueAtChange,
}: Props) {
  const series = seriesOptions.find((s) => s.id === seriesId)
  const year = issuedAt ? new Date(issuedAt).getFullYear() : new Date().getFullYear()
  const previewNumber = series
    ? `${series.code}-${year}-${String(series.nextNumber).padStart(4, '0')}`
    : ''

  const inputClass =
    'w-full px-3 py-2 bg-[var(--surface-raised)] border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors'

  return (
    <section className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-4">
      <h2 className="text-lg font-medium text-[var(--text)]">Datos de la factura</h2>

      <ClientAutocomplete
        value={clientId}
        label={clientLabel}
        onChange={onClientChange}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">Serie</label>
          <select
            value={seriesId}
            onChange={(e) => onSeriesChange(e.target.value)}
            className={inputClass}
          >
            {seriesOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">
            Próximo número
          </label>
          <div className="px-3 py-2 bg-[var(--surface-raised)] border border-[var(--border)] rounded-md text-[var(--text-dim)] font-mono text-sm">
            {previewNumber || '—'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">
            Fecha emisión *
          </label>
          <input
            type="date"
            value={issuedAt}
            onChange={(e) => onIssuedAtChange(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">
            Fecha vencimiento
          </label>
          <input
            type="date"
            value={dueAt}
            onChange={(e) => onDueAtChange(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
    </section>
  )
}

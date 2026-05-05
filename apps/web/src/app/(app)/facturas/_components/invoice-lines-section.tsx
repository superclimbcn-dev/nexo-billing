'use client'

import { InvoiceLineRow } from './invoice-line-row'
import type { InvoiceLineState } from './invoice-form'

interface Props {
  lines: InvoiceLineState[]
  onAdd: () => void
  onUpdate: (tempId: string, patch: Partial<InvoiceLineState>) => void
  onRemove: (tempId: string) => void
}

export function InvoiceLinesSection({ lines, onAdd, onUpdate, onRemove }: Props) {
  return (
    <section className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-[var(--text)]">Líneas</h2>
        <button
          type="button"
          onClick={onAdd}
          className="text-sm text-[var(--accent)] hover:text-[var(--accent-dim)] transition-colors"
        >
          + Añadir línea
        </button>
      </div>

      {/* Column headers — only visible md+ */}
      <div className="hidden md:grid grid-cols-12 gap-2 px-2 text-xs text-[var(--text-dim)] uppercase tracking-wide">
        <div className="col-span-5">Descripción</div>
        <div className="col-span-2 text-right">Cant.</div>
        <div className="col-span-2 text-right">Precio</div>
        <div className="col-span-2">IVA</div>
        <div className="col-span-1 text-right">Subtotal</div>
      </div>

      <div className="space-y-2">
        {lines.length === 0 ? (
          <p className="text-sm text-[var(--text-dim)] text-center py-4">
            Sin líneas. Añade al menos una.
          </p>
        ) : (
          lines.map((line, idx) => (
            <InvoiceLineRow
              key={line.tempId}
              line={line}
              index={idx}
              onUpdate={(patch) => onUpdate(line.tempId, patch)}
              onRemove={() => onRemove(line.tempId)}
              canRemove={lines.length > 1}
            />
          ))
        )}
      </div>
    </section>
  )
}

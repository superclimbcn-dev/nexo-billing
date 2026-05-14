'use client'

import { ItemAutocomplete } from './item-autocomplete'
import type { InvoiceLineState } from './invoice-form'

interface Props {
  line: InvoiceLineState
  index: number
  onUpdate: (patch: Partial<InvoiceLineState>) => void
  onRemove: () => void
  canRemove: boolean
}

export function InvoiceLineRow({ line, onUpdate, onRemove, canRemove }: Props) {
  const qty =
    typeof line.quantity === 'string'
      ? parseFloat(line.quantity.replace(',', '.')) || 0
      : line.quantity
  const price =
    typeof line.unitPrice === 'string'
      ? parseFloat(line.unitPrice.replace(',', '.')) || 0
      : line.unitPrice
  const lineSubtotal = qty * price

  const cellInput =
    'w-full px-2 py-1.5 bg-[var(--surface-raised)] border border-[var(--border)] rounded-md text-sm focus:outline-none focus:border-[var(--accent)] transition-colors'

  return (
    <div className="grid grid-cols-12 gap-2 items-start p-2 border border-[var(--border)] rounded-md hover:border-[var(--border-strong)] transition-colors">
      {/* Descripción / autocomplete — 5 cols */}
      <div className="col-span-12 md:col-span-5">
        <ItemAutocomplete
          value={line.description}
          onItemSelected={(item) =>
            onUpdate({
              itemId: item.source === 'tenant' ? item.id : null,
              description: item.name,
              unit: item.unit ?? '',
              unitPrice: item.unitPrice,
              vatRate: item.vatRate,
            })
          }
          onTextChange={(text) => onUpdate({ description: text, itemId: null })}
        />
      </div>

      {/* Cantidad — 2 cols */}
      <div className="col-span-3 md:col-span-2">
        <input
          type="text"
          inputMode="decimal"
          value={line.quantity}
          onChange={(e) => onUpdate({ quantity: e.target.value })}
          placeholder="Cant."
          className={`${cellInput} text-right`}
        />
      </div>

      {/* Precio — 2 cols */}
      <div className="col-span-4 md:col-span-2">
        <input
          type="text"
          inputMode="decimal"
          value={line.unitPrice}
          onChange={(e) => onUpdate({ unitPrice: e.target.value })}
          placeholder="Precio"
          className={`${cellInput} text-right`}
        />
      </div>

      {/* IVA — 2 cols */}
      <div className="col-span-4 md:col-span-2">
        <select
          value={String(line.vatRate)}
          onChange={(e) => onUpdate({ vatRate: parseFloat(e.target.value) })}
          className={cellInput}
        >
          <option value="0">0%</option>
          <option value="4">4%</option>
          <option value="10">10%</option>
          <option value="21">21%</option>
        </select>
      </div>

      {/* Subtotal — 1 col */}
      <div className="col-span-3 md:col-span-1 text-right text-sm py-1.5 font-mono text-[var(--text-dim)]">
        {lineSubtotal.toFixed(2).replace('.', ',')} €
      </div>

      {/* Borrar — 1 col */}
      <div className="col-span-2 md:col-span-0 flex justify-end">
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="w-7 h-7 flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded transition-colors"
            title="Eliminar línea"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

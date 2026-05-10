'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createRectificativa } from '../../_lib/rectificativa-actions'
import type { CreateRectificativaInput } from '../../_lib/rectificativa-schema'

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
  vatRate: number
}

interface Props {
  invoiceId: string
  fullNumber: string
  originalLines: Array<{
    description: string
    quantity: number
    unitPrice: number
    vatRate: number
  }>
  onClose: () => void
}

const TYPE_LABELS: Record<string, string> = {
  R1: 'R1 — Error fundado en derecho',
  R2: 'R2 — Devolución de mercancía',
  R3: 'R3 — Descuento posterior',
  R4: 'R4 — Obra por administración',
  R5: 'R5 — Resolución de contrato',
}

function roundCents(v: number): number {
  return Math.round(v * 100) / 100
}

function calculateTotals(lines: LineItem[]) {
  let subtotal = 0
  let vatTotal = 0
  for (const line of lines) {
    const lineSub = roundCents(line.quantity * line.unitPrice)
    const lineVat = roundCents(lineSub * (line.vatRate / 100))
    subtotal += lineSub
    vatTotal += lineVat
  }
  return {
    subtotal: roundCents(subtotal),
    vatTotal: roundCents(vatTotal),
    total: roundCents(subtotal + vatTotal),
  }
}

export function RectificativaModal({ invoiceId, fullNumber, originalLines, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [type, setType] = useState<'R1' | 'R2' | 'R3' | 'R4' | 'R5'>('R1')
  const [reason, setReason] = useState('')
  const [lines, setLines] = useState<LineItem[]>(
    (originalLines ?? []).map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: -Math.abs(l.unitPrice),
      vatRate: l.vatRate,
    })),
  )

  const totals = calculateTotals(lines)

  function updateLine(index: number, field: keyof LineItem, value: string | number) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)),
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!reason.trim()) {
      setError('El motivo es obligatorio')
      return
    }
    if (lines.length === 0) {
      setError('Debe haber al menos una línea')
      return
    }

    const payload: CreateRectificativaInput = {
      originalInvoiceId: invoiceId,
      type,
      reason: reason.trim(),
      lines: lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        vatRate: l.vatRate,
      })),
    }

    startTransition(async () => {
      const res = await createRectificativa(payload)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
      onClose()
    })
  }

  const inputClass =
    'w-full px-3 py-2 bg-[var(--surface-raised)] border border-[var(--border)] rounded-md text-sm focus:outline-none focus:border-[var(--accent)] transition-colors'
  const tableCellClass =
    'px-2 py-1.5 bg-[var(--surface-raised)] border border-[var(--border)] rounded-md text-sm focus:outline-none focus:border-[var(--accent)] transition-colors'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text)]">
            Crear rectificativa de {fullNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-md">
            <p className="text-sm text-[var(--danger)]">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              Tipo de rectificativa
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className={inputClass}
            >
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              Motivo de la rectificación
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Describe el motivo de la rectificación..."
              className={inputClass}
            />
          </div>

          {/* Líneas */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              Líneas de rectificación
            </label>
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface-raised)]">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-dim)] uppercase">
                      Descripción
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[var(--text-dim)] uppercase w-24">
                      Cant.
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[var(--text-dim)] uppercase w-28">
                      Precio
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[var(--text-dim)] uppercase w-20">
                      IVA %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, idx) => (
                    <tr key={idx} className="border-t border-[var(--border)]">
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={line.description}
                          onChange={(e) => updateLine(idx, 'description', e.target.value)}
                          className={tableCellClass}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          step="0.001"
                          value={line.quantity}
                          onChange={(e) => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className={`${tableCellClass} text-right`}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(e) => updateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className={`${tableCellClass} text-right`}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={line.vatRate}
                          onChange={(e) => updateLine(idx, 'vatRate', parseFloat(e.target.value) || 0)}
                          className={`${tableCellClass} text-right`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[var(--text-dim)] mt-1">
              Los valores negativos generan una factura rectificativa (abono). Los positivos, una rectificación al alza.
            </p>
          </div>

          {/* Resumo */}
          <div className="p-4 bg-[var(--surface-raised)] rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-dim)]">Base rectificada</span>
              <span className="font-medium">{totals.subtotal.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-dim)]">IVA rectificado</span>
              <span className="font-medium">{totals.vatTotal.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-sm border-t border-[var(--border)] pt-2">
              <span className="text-[var(--text-dim)]">Total rectificado</span>
              <span className="font-semibold text-[var(--text)]">{totals.total.toFixed(2)} €</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[var(--border)] text-[var(--text-dim)] font-medium rounded-md hover:bg-[var(--surface-hover)] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md hover:bg-[var(--accent-dim)] disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Creando...' : 'Crear rectificativa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

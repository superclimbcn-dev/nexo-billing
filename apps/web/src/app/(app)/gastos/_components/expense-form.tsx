'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createExpense, updateExpense } from '../_lib/expense-actions'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '../_lib/expense-schema'

interface Props {
  expense?: {
    id: string
    totalAmount: number
    issuedAt: Date
    category: ExpenseCategory | null
    notes: string | null
    vendor: string | null
  }
  onClose: () => void
  onSuccess?: () => void
}

export function ExpenseForm({ expense, onClose, onSuccess }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [amount, setAmount] = useState(
    expense ? expense.totalAmount.toFixed(2).replace('.', ',') : '',
  )
  const [date, setDate] = useState(
    expense
      ? expense.issuedAt.toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  )
  const [category, setCategory] = useState<ExpenseCategory>(
    expense?.category ?? 'OTROS',
  )
  const [description, setDescription] = useState(expense?.notes ?? '')
  const [vendor, setVendor] = useState(expense?.vendor ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const raw = {
      amount: amount.replace(',', '.'),
      date,
      category,
      description: description || undefined,
      vendor: vendor || undefined,
    }

    startTransition(async () => {
      const res = expense
        ? await updateExpense(expense.id, raw)
        : await createExpense(raw)

      if (!res.ok) {
        setError(res.error)
      } else {
        router.refresh()
        onSuccess?.()
        onClose()
      }
    })
  }

  const inputClass =
    'w-full px-3 py-2 bg-[var(--surface-raised)] border border-[var(--border)] rounded-md text-sm focus:outline-none focus:border-[var(--accent)] transition-colors'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-md">
          <p className="text-sm text-[var(--danger)]">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">
            Importe (€) *
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">
            Fecha *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-1">
          Categoría *
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          required
          className={inputClass}
        >
          {EXPENSE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'ALIMENTACION' && 'Alimentación'}
              {cat === 'TRANSPORTE' && 'Transporte'}
              {cat === 'MATERIAL' && 'Material'}
              {cat === 'SERVICIOS' && 'Servicios'}
              {cat === 'OTROS' && 'Otros'}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-1">
          Descripción
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Ej: Tornillos, gasolina, comida..."
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-1">
          Proveedor
        </label>
        <input
          type="text"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
          placeholder="Ej: Ferretería López, Repsol..."
          className={inputClass}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 px-4 py-2 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md hover:bg-[var(--accent-dim)] disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Guardando...' : expense ? 'Actualizar' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-[var(--border)] rounded-md text-[var(--text-dim)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

'use client'

import type { ExpenseStatus, PaymentMethod } from '@nexo/prisma'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { parseCurrency } from '@nexo/core-utils'
import { createExpense, updateExpense } from '../_lib/expense-actions'
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '../_lib/expense-payment'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '../_lib/expense-schema'
import {
  calculateExpenseTotals,
  EXPENSE_VAT_RATES,
  type ExpenseVatRate,
} from '../_lib/expense-totals'

interface Props {
  expense?: {
    id: string
    totalAmount: number
    issuedAt: Date
    status: ExpenseStatus
    paidAt: Date | null
    paymentMethod: PaymentMethod | null
    category: ExpenseCategory | null
    notes: string | null
    vendor: string | null
    subtotal: number
    vatAmount: number
    vatRate: number | null
    vatDeductiblePercent: number | null
    irpfDeductiblePercent: number | null
    externalNumber: string | null
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
  const [status, setStatus] = useState(expense?.status ?? 'paid')
  const [paidAt, setPaidAt] = useState(expense?.paidAt?.toISOString().slice(0, 10) ?? '')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>(expense?.paymentMethod ?? '')
  const [category, setCategory] = useState<ExpenseCategory>(
    expense?.category ?? 'OTROS',
  )
  const [description, setDescription] = useState(expense?.notes ?? '')
  const [vendor, setVendor] = useState(expense?.vendor ?? '')
  const [externalNumber, setExternalNumber] = useState(expense?.externalNumber ?? '')
  const [vatRate, setVatRate] = useState<ExpenseVatRate | null>(
    expense ? (expense.vatRate as ExpenseVatRate | null) : 21,
  )
  const [vatDeductiblePercent, setVatDeductiblePercent] = useState<number | null>(
    expense?.vatDeductiblePercent ?? null,
  )
  const [irpfDeductiblePercent, setIrpfDeductiblePercent] = useState<number | null>(
    expense?.irpfDeductiblePercent ?? null,
  )

  const parsedAmount = parseCurrency(amount)
  const totals = vatRate !== null && Number.isFinite(parsedAmount) && parsedAmount > 0
    ? calculateExpenseTotals(parsedAmount, vatRate)
    : expense && vatRate === null
      ? {
          subtotal: expense.subtotal,
          vatAmount: expense.vatAmount,
          totalAmount: expense.totalAmount,
        }
      : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const raw = {
      amount,
      date,
      category,
      status,
      paidAt: status === 'paid' ? paidAt || date : null,
      paymentMethod: status === 'paid' ? paymentMethod || null : null,
      description: description || undefined,
      vendor: vendor || undefined,
      externalNumber: externalNumber || undefined,
      vatRate,
      vatDeductiblePercent,
      irpfDeductiblePercent,
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
            IVA *
          </label>
          <select
            value={vatRate ?? ''}
            onChange={(e) =>
              setVatRate(e.target.value === '' ? null : Number(e.target.value) as ExpenseVatRate)
            }
            required={!expense}
            className={inputClass}
          >
            {expense?.vatRate === null && <option value="">Sin definir (gasto antiguo)</option>}
            {EXPENSE_VAT_RATES.map((rate) => (
              <option key={rate} value={rate}>{rate}%</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">
            Base imponible
          </label>
          <input
            type="text"
            readOnly
            value={totals ? totals.subtotal.toFixed(2).replace('.', ',') : '—'}
            className={`${inputClass} text-[var(--text-dim)]`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">
            Cuota IVA
          </label>
          <input
            type="text"
            readOnly
            value={totals ? totals.vatAmount.toFixed(2).replace('.', ',') : '—'}
            className={`${inputClass} text-[var(--text-dim)]`}
          />
        </div>
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

      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-1">
          Nº factura / ticket
        </label>
        <input
          type="text"
          value={externalNumber}
          onChange={(e) => setExternalNumber(e.target.value)}
          maxLength={100}
          placeholder="Ej: F-2026-0042"
          className={inputClass}
        />
      </div>

      <fieldset className="space-y-3 border-t border-[var(--border)] pt-4">
        <legend className="text-sm font-medium text-[var(--text)] pr-2">Pago</legend>
        <label className="block text-sm">
          Estado del pago
          <select value={status} onChange={(e) => setStatus(e.target.value as ExpenseStatus)} className={inputClass}>
            <option value="paid">Pagado</option>
            <option value="pending">Pendiente</option>
            {status !== 'paid' && status !== 'pending' && <option value={status}>{{ partially_paid: 'Pago parcial', overdue: 'Vencido', cancelled: 'Anulado' }[status]}</option>}
          </select>
        </label>
        {status === 'paid' && (
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm">
              Fecha de pago *
              <input type="date" required value={paidAt || date}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setPaidAt(e.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm">
              Forma de pago{expense?.status === 'pending' ? ' *' : ''}
              <select value={paymentMethod} required={expense?.status === 'pending'}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | '')} className={inputClass}>
                <option value="">Sin definir</option>
                {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{PAYMENT_METHOD_LABELS[method]}</option>)}
              </select>
            </label>
          </div>
        )}
        <p className="text-xs text-[var(--text-dim)]">El estado del pago solo afecta a tesorería. No modifica la deducción de IVA ni de IRPF.</p>
      </fieldset>

      <fieldset className="space-y-3 border-t border-[var(--border)] pt-4">
        <legend className="text-sm font-medium text-[var(--text)] pr-2">
          Tratamiento fiscal
        </legend>
        <div className="grid grid-cols-2 gap-4">
          <DeductibleSelect
            label="IVA deducible"
            value={vatDeductiblePercent}
            onChange={setVatDeductiblePercent}
            inputClass={inputClass}
          />
          <DeductibleSelect
            label="Gasto deducible IRPF"
            value={irpfDeductiblePercent}
            onChange={setIrpfDeductiblePercent}
            inputClass={inputClass}
          />
        </div>
      </fieldset>

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

function DeductibleSelect({
  label,
  value,
  onChange,
  inputClass,
}: {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  inputClass: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text)] mb-1">{label}</label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className={inputClass}
      >
        <option value="">Sin definir</option>
        <option value="100">100%</option>
        <option value="50">50%</option>
        <option value="0">0%</option>
      </select>
    </div>
  )
}

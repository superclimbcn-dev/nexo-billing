'use client'

import { useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markExpensePaid } from '../_lib/expense-actions'
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '../_lib/expense-payment'

export function ExpensePaymentButton({ expenseId }: { expenseId: string }) {
  const router = useRouter()
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const inputClass = 'w-full mt-1 rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2'

  return (
    <>
      <button type="button" className="block text-xs text-[var(--accent)] mt-1 hover:underline"
        onClick={() => { setError(null); setOpen(true) }}>
        Registrar pago
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 text-left">
          <form role="dialog" aria-modal="true" aria-labelledby={titleId}
            className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 text-sm"
            onSubmit={(event) => {
              event.preventDefault()
              const data = new FormData(event.currentTarget)
              startTransition(async () => {
                const result = await markExpensePaid(expenseId, {
                  paidAt: data.get('paidAt'), paymentMethod: data.get('paymentMethod'),
                })
                if (!result.ok) setError(result.error)
                else { setOpen(false); router.refresh() }
              })
            }}>
            <h2 id={titleId} className="text-lg font-semibold">Registrar pago</h2>
            <label className="block">Fecha de pago *
              <input autoFocus name="paidAt" type="date" required className={inputClass}
                defaultValue={new Date().toISOString().slice(0, 10)}
                max={new Date().toISOString().slice(0, 10)} />
            </label>
            <label className="block">Forma de pago *
              <select name="paymentMethod" required defaultValue="" className={inputClass}>
                <option value="" disabled>Selecciona una forma de pago</option>
                {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{PAYMENT_METHOD_LABELS[method]}</option>)}
              </select>
            </label>
            {error && <p role="alert" className="text-[var(--danger)]">{error}</p>}
            <div className="flex gap-3">
              <button disabled={pending} type="submit" className="rounded-md bg-[var(--accent)] text-[var(--bg)] px-4 py-2 disabled:opacity-50">
                {pending ? 'Guardando...' : 'Confirmar pago'}
              </button>
              <button disabled={pending} type="button" onClick={() => setOpen(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createSimplifiedInvoice } from '../_lib/invoice-actions'

const PAYMENT_METHODS = [
  { value: 'card', label: 'Tarjeta / TPV' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'bank_transfer', label: 'Transferencia bancaria' },
  { value: 'bizum', label: 'Bizum' },
  { value: 'direct_debit', label: 'Domiciliación bancaria' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Otro' },
] as const

type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value']

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function parseAmount(value: string): number {
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function SimplifiedInvoiceForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [issuedAt, setIssuedAt] = useState(todayISO())
  const [operationAt, setOperationAt] = useState(todayISO())
  const [description, setDescription] = useState('')
  const [totalVatIncluded, setTotalVatIncluded] = useState('')
  const [vatRate, setVatRate] = useState('21')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [paymentReference, setPaymentReference] = useState('')
  const [consumerHomeService, setConsumerHomeService] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  const preview = useMemo(() => {
    const total = parseAmount(totalVatIncluded)
    const rate = Number(vatRate)
    if (total <= 0) return { subtotal: 0, vat: 0 }
    const subtotal = roundMoney(total / (1 + rate / 100))
    return { subtotal, vat: roundMoney(total - subtotal) }
  }, [totalVatIncluded, vatRate])

  const maximum = consumerHomeService ? 3000 : 400
  const inputClass =
    'w-full rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-[var(--text)] transition-colors focus:border-[var(--accent)] focus:outline-none'

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setGeneralError(null)

    startTransition(async () => {
      const result = await createSimplifiedInvoice({
        issuedAt,
        operationAt,
        description,
        totalVatIncluded,
        vatRate,
        paymentMethod,
        paymentReference,
        consumerHomeService,
      })

      if (result.ok) {
        router.push(`/facturas/${result.data.id}`)
        router.refresh()
        return
      }

      setGeneralError(result.error)
      if (result.fieldErrors) setErrors(result.fieldErrors)
    })
  }

  function fieldError(field: string) {
    const message = errors[field]?.[0]
    return message ? <p className="mt-1 text-xs text-[var(--danger)]">{message}</p> : null
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {generalError && (
          <div className="rounded-md border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">
            {generalError}
          </div>
        )}

        <section className="space-y-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <div>
            <h2 className="text-lg font-medium text-[var(--text)]">Datos de la operación</h2>
            <p className="mt-1 text-sm text-[var(--text-dim)]">
              Se emitirá en la serie FS y el cobro quedará registrado en el mismo paso.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                Fecha de expedición *
              </label>
              <input type="date" value={issuedAt} onChange={(event) => setIssuedAt(event.target.value)} className={inputClass} />
              {fieldError('issuedAt')}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                Fecha de operación *
              </label>
              <input type="date" value={operationAt} max={issuedAt} onChange={(event) => setOperationAt(event.target.value)} className={inputClass} />
              {fieldError('operationAt')}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text)]">
              Descripción del servicio *
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Ej.: Servicio de reparación realizado en domicilio"
              className={inputClass}
            />
            {fieldError('description')}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                Total IVA incluido *
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={totalVatIncluded}
                  onChange={(event) => setTotalVatIncluded(event.target.value)}
                  placeholder="0,00"
                  className={`${inputClass} pr-9`}
                />
                <span className="absolute right-3 top-2 text-[var(--text-dim)]">€</span>
              </div>
              <p className="mt-1 text-xs text-[var(--text-dim)]">Límite aplicable: {maximum.toLocaleString('es-ES')} €</p>
              {fieldError('totalVatIncluded')}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">Tipo de IVA *</label>
              <select value={vatRate} onChange={(event) => setVatRate(event.target.value)} className={inputClass}>
                {[0, 4, 10, 21].map((rate) => (
                  <option key={rate} value={rate}>{rate}%</option>
                ))}
              </select>
              {fieldError('vatRate')}
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-3">
            <input
              type="checkbox"
              checked={consumerHomeService}
              onChange={(event) => setConsumerHomeService(event.target.checked)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-[var(--text)]">Servicio a domicilio del consumidor</span>
              <span className="mt-0.5 block text-xs text-[var(--text-dim)]">
                Declara esta condición legal para ampliar el límite de 400 € a 3.000 € IVA incluido.
              </span>
            </span>
          </label>
        </section>

        <section className="space-y-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-lg font-medium text-[var(--text)]">Cobro recibido</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">Método de pago *</label>
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)} className={inputClass}>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>{method.label}</option>
                ))}
              </select>
              {fieldError('paymentMethod')}
            </div>
            {paymentMethod === 'card' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text)]">Referencia TPV (opcional)</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                  maxLength={120}
                  placeholder="N.º de operación del TPV"
                  className={inputClass}
                />
                {fieldError('paymentReference')}
              </div>
            )}
          </div>
        </section>
      </div>

      <aside className="lg:col-span-1">
        <div className="space-y-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 lg:sticky lg:top-6">
          <div>
            <p className="text-sm text-[var(--text-dim)]">Base imponible</p>
            <p className="font-mono text-xl text-[var(--text)]">{preview.subtotal.toFixed(2)} €</p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-dim)]">Cuota IVA ({vatRate}%)</p>
            <p className="font-mono text-xl text-[var(--text)]">{preview.vat.toFixed(2)} €</p>
          </div>
          <div className="border-t border-[var(--border)] pt-3">
            <p className="text-sm text-[var(--text-dim)]">Total cobrado</p>
            <p className="font-mono text-2xl font-medium text-[var(--text)]">{parseAmount(totalVatIncluded).toFixed(2)} €</p>
          </div>
          <p className="text-xs text-[var(--text-dim)]">
            Vista previa. El servidor recalculará base e IVA con redondeo fiscal antes de guardar.
          </p>
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-[var(--accent)] px-4 py-2 font-medium text-[var(--bg)] transition-colors hover:bg-[var(--accent-dim)] disabled:opacity-50"
          >
            {isPending ? 'Emitiendo...' : 'Emitir y registrar cobro'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/facturas')}
            className="w-full rounded-md border border-[var(--border)] px-4 py-2 text-[var(--text-dim)] transition-colors hover:bg-[var(--surface-hover)]"
          >
            Cancelar
          </button>
        </div>
      </aside>
    </form>
  )
}

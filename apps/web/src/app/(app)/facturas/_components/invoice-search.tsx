'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { INVOICE_STATUS_LABELS } from '../_lib/invoice-status'

interface InvoiceSearchProps {
  initialSearch: string
  initialStatus: string
  clientId?: string
}

export function InvoiceSearch({ initialSearch, initialStatus, clientId }: InvoiceSearchProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [status, setStatus] = useState(initialStatus)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => {
      const params = new URLSearchParams()
      if (search.trim()) params.set('q', search.trim())
      if (status) params.set('estado', status)
      if (clientId) params.set('clientId', clientId)
      const query = params.toString()
      router.push(`/facturas${query ? `?${query}` : ''}`)
    })
  }

  const inputClass =
    'px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)]'

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        placeholder="Buscar por nº factura, cliente o NIF..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={`flex-1 ${inputClass}`}
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className={`${inputClass} pr-8`}
      >
        <option value="">Todos los estados</option>
        {(Object.entries(INVOICE_STATUS_LABELS) as [string, string][]).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text-dim)] hover:bg-[var(--surface-hover)] disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Buscando...' : 'Buscar'}
      </button>
    </form>
  )
}

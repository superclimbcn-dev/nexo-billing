'use client'

import { useState, useTransition } from 'react'
import { exportData, type ExportFilters } from '../_lib/export-actions'

export function ExportModal({ onClose }: { onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10)
  const today = now.toISOString().slice(0, 10)

  const [dateFrom, setDateFrom] = useState(startOfMonth)
  const [dateTo, setDateTo] = useState(today)
  const [includeInvoices, setIncludeInvoices] = useState(true)
  const [includeExpenses, setIncludeExpenses] = useState(true)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const types: ExportFilters['types'] = []
    if (includeInvoices) types.push('invoices')
    if (includeExpenses) types.push('expenses')
    if (types.length === 0) {
      setError('Selecciona al menos un tipo de dato')
      return
    }

    startTransition(async () => {
      const res = await exportData({
        dateFrom,
        dateTo,
        types: types.length === 2 ? ['all'] : types,
      })

      if (!res.ok) {
        setError(res.error)
        return
      }

      const blob = new Blob([Buffer.from(res.data.buffer)], { type: 'application/zip' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.data.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      onClose()
    })
  }

  const inputClass =
    'w-full px-3 py-2 bg-[var(--surface-raised)] border border-[var(--border)] rounded-md text-sm focus:outline-none focus:border-[var(--accent)] transition-colors'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text)]">Exportar datos</h2>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                Desde
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              Datos a incluir
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                <input
                  type="checkbox"
                  checked={includeInvoices}
                  onChange={(e) => setIncludeInvoices(e.target.checked)}
                  className="rounded border-[var(--border)]"
                />
                Facturas
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                <input
                  type="checkbox"
                  checked={includeExpenses}
                  onChange={(e) => setIncludeExpenses(e.target.checked)}
                  className="rounded border-[var(--border)]"
                />
                Gastos
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="w-full px-4 py-2 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md hover:bg-[var(--accent-dim)] disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Generando ZIP...' : 'Generar ZIP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { ReportRequest } from '@/lib/reports/report-period'

export function ReportDownloadButtons({
  request,
  disabled = false,
}: {
  request: ReportRequest
  disabled?: boolean
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  async function download(format: 'pdf' | 'csv' | 'zip') {
    setBusy(format)
    setError(null)
    try {
      const query = new URLSearchParams()
      Object.entries({ ...request, format }).forEach(([key, value]) => {
        if (value !== undefined && value !== '') query.set(key, String(value))
      })
      const response = await fetch(`/api/reports?${query}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      })
      if (response.redirected) {
        throw new Error('La sesión ha caducado. Inicia sesión de nuevo para descargar el informe.')
      }
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null)
        throw new Error(
          typeof body === 'object' && body && 'error' in body && typeof body.error === 'string'
            ? body.error
            : 'No se ha podido descargar el informe',
        )
      }
      const expectedType = { pdf: 'application/pdf', csv: 'text/csv', zip: 'application/zip' }[format]
      if (!response.headers.get('Content-Type')?.startsWith(expectedType)) {
        throw new Error('El servidor no ha devuelto un informe válido. Inténtalo de nuevo.')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download =
        response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] ??
        `nexo_informe.${format}`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al descargar el informe')
    } finally {
      setBusy(null)
    }
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {(['pdf', 'csv', ...(request.report === 'advisor' ? (['zip'] as const) : [])] as const).map(
          (format) => (
            <button
              key={format}
              type="button"
              onClick={() => download(format)}
              disabled={disabled || busy !== null}
              className="px-4 py-2 border border-[var(--border)] rounded-md text-sm hover:bg-[var(--surface-hover)] disabled:opacity-50"
            >
              {busy === format
                ? 'Generando…'
                : format === 'zip'
                  ? 'Exportar ZIP (CSV separados)'
                  : `Exportar ${format.toUpperCase()}`}
            </button>
          ),
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  )
}

export function ReportControls({ request }: { request: ReportRequest }) {
  const router = useRouter()
  const pathname = usePathname()
  const [draft, setDraft] = useState(request)
  const dirty = JSON.stringify(draft) !== JSON.stringify(request)
  const input =
    'block mt-1 px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--surface-raised)] text-sm'
  const set = (key: string, value: string | number) => setDraft((old) => ({ ...old, [key]: value }))
  return (
    <div className="space-y-3">
      <form
        className="flex flex-wrap gap-3 items-end"
        onSubmit={(event) => {
          event.preventDefault()
          const query = new URLSearchParams()
          Object.entries(draft).forEach(([key, value]) => {
            if (value !== undefined && value !== '') query.set(key, String(value))
          })
          router.push(`${pathname}?${query}`)
        }}
      >
        <label className="text-sm">
          Período
          <select
            className={input}
            value={draft.period}
            onChange={(e) => set('period', e.target.value)}
          >
            <option value="month">Mes</option>
            <option value="quarter">Trimestre</option>
            <option value="year">Año</option>
            {request.report === 'treasury' && (
              <option value="custom">Intervalo personalizado</option>
            )}
          </select>
        </label>
        {draft.period !== 'custom' && (
          <label className="text-sm">
            Año
            <input
              className={input}
              type="number"
              required
              min="2024"
              max="2100"
              value={draft.year ?? ''}
              onChange={(e) => set('year', Number(e.target.value))}
            />
          </label>
        )}
        {draft.period === 'month' && (
          <label className="text-sm">
            Mes
            <select
              className={input}
              value={draft.month ?? 1}
              onChange={(e) => set('month', Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i + 1}>
                  {new Date(2026, i, 1).toLocaleDateString('es-ES', { month: 'long' })}
                </option>
              ))}
            </select>
          </label>
        )}
        {draft.period === 'quarter' && (
          <label className="text-sm">
            Trimestre
            <select
              className={input}
              value={draft.quarter ?? 'Q1'}
              onChange={(e) => set('quarter', e.target.value)}
            >
              {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </label>
        )}
        {draft.period === 'custom' && (
          <>
            <label className="text-sm">
              Desde
              <input
                className={input}
                type="date"
                required
                value={draft.from ?? ''}
                onChange={(e) => set('from', e.target.value)}
              />
            </label>
            <label className="text-sm">
              Hasta
              <input
                className={input}
                type="date"
                required
                min={draft.from}
                value={draft.to ?? ''}
                onChange={(e) => set('to', e.target.value)}
              />
            </label>
          </>
        )}
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-[var(--accent)] text-[var(--bg)] text-sm font-medium"
        >
          Ver período
        </button>
      </form>
      <ReportDownloadButtons request={request} disabled={dirty} />
      {dirty && (
        <p className="text-xs text-[var(--text-dim)]">
          Aplica el período para actualizar el resumen y las exportaciones.
        </p>
      )}
    </div>
  )
}

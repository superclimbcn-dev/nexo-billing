'use client'

import { useRef, useState, useTransition } from 'react'

export function CsvImportButton() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null)

  function handleClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    startTransition(async () => {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch('/api/import/csv', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()

        if (!res.ok) {
          setResult({ imported: 0, errors: [data.error || 'Error desconocido'] })
        } else {
          setResult({ imported: data.imported ?? 0, errors: data.errors ?? [] })
        }
      } catch (err) {
        setResult({
          imported: 0,
          errors: [err instanceof Error ? err.message : 'Error de red'],
        })
      }

      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = ''
    })
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center justify-center px-5 py-3 rounded-md bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--border)] text-sm font-semibold hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50"
      >
        {isPending ? 'Importando…' : 'Importar CSV'}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {result && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 shadow-lg">
            {result.imported > 0 ? (
              <p className="text-sm text-[var(--success)] font-medium">
                ✅ {result.imported} factura{result.imported > 1 ? 's' : ''} importada
                {result.imported > 1 ? 's' : ''} correctamente
              </p>
            ) : (
              <p className="text-sm text-[var(--danger)] font-medium">
                ❌ No se pudo importar
              </p>
            )}
            {result.errors.length > 0 && (
              <ul className="mt-2 text-xs text-[var(--text-dim)] space-y-1 max-h-32 overflow-y-auto">
                {result.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
                {result.errors.length > 5 && (
                  <li>… y {result.errors.length - 5} errores más</li>
                )}
              </ul>
            )}
            <button
              onClick={() => setResult(null)}
              className="mt-3 text-xs text-[var(--accent)] hover:underline"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  )
}

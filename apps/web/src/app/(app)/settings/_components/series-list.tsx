'use client'

import { useState } from 'react'
import { updateSeries, deactivateSeries, activateSeries, createSeries } from '../_lib/settings-actions'

interface Series {
  id: string
  code: string
  name: string
  nextNumber: number
  isActive: boolean
  isDefault: boolean
}

type FieldErrors = Record<string, string[]>

function seriesPreview(code: string, nextNumber: number): string {
  const year = new Date().getFullYear()
  return `${code}-${year}-${String(nextNumber).padStart(4, '0')}`
}

export function SeriesList({ series }: { series: Series[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNextNumber, setEditNextNumber] = useState('')
  const [editName, setEditName] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  const [showCreate, setShowCreate] = useState(false)
  const [createCode, setCreateCode] = useState('')
  const [createName, setCreateName] = useState('')
  const [createNext, setCreateNext] = useState('1')
  const [createErrors, setCreateErrors] = useState<FieldErrors>({})
  const [createSaving, setCreateSaving] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [actionError, setActionError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  function startEdit(s: Series) {
    setEditingId(s.id)
    setEditName(s.name)
    setEditNextNumber(String(s.nextNumber))
    setEditError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditError(null)
  }

  async function saveEdit(id: string) {
    setEditSaving(true)
    setEditError(null)
    const result = await updateSeries({
      id,
      name: editName,
      nextNumber: parseInt(editNextNumber, 10),
    })
    setEditSaving(false)
    if (result.ok) {
      setEditingId(null)
      setSuccessMsg('Serie actualizada.')
      setTimeout(() => setSuccessMsg(null), 3000)
    } else {
      setEditError(result.error)
    }
  }

  async function handleDeactivate(id: string) {
    setActionError(null)
    const result = await deactivateSeries(id)
    if (!result.ok) setActionError(result.error)
  }

  async function handleActivate(id: string) {
    setActionError(null)
    const result = await activateSeries(id)
    if (!result.ok) setActionError(result.error)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateSaving(true)
    setCreateErrors({})
    setCreateError(null)

    const result = await createSeries({
      code: createCode.toUpperCase(),
      name: createName,
      nextNumber: parseInt(createNext, 10),
    })
    setCreateSaving(false)

    if (result.ok) {
      setShowCreate(false)
      setCreateCode('')
      setCreateName('')
      setCreateNext('1')
      setSuccessMsg('Serie creada correctamente.')
      setTimeout(() => setSuccessMsg(null), 3000)
    } else {
      setCreateError(result.error)
      if (result.fieldErrors) setCreateErrors(result.fieldErrors)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-dim)]">
        <span className="text-base">💡</span>
        <p>
          Si vienes de otro sistema, ajusta el <strong className="text-[var(--text)]">Próximo número</strong> al siguiente que necesites.
          Por ejemplo, si tu última factura fue <code className="font-mono text-xs">A-2026-0234</code>, pon <strong className="text-[var(--text)]">235</strong>.
        </p>
      </div>

      {actionError && <p className="text-sm text-[var(--danger)] px-1">{actionError}</p>}
      {successMsg && <p className="text-sm text-[var(--success)] px-1">{successMsg}</p>}

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs text-[var(--text-dim)] uppercase tracking-wider">
              <th className="text-left px-4 py-3 font-medium">Código</th>
              <th className="text-left px-4 py-3 font-medium">Nombre</th>
              <th className="text-right px-4 py-3 font-medium">Próximo nº</th>
              <th className="text-left px-4 py-3 font-medium">Vista previa</th>
              <th className="text-center px-4 py-3 font-medium">Estado</th>
              <th className="text-right px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {series.map((s) => (
              <tr key={s.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                <td className="px-4 py-3 font-mono text-sm font-medium text-[var(--text)]">
                  {s.code}
                  {s.isDefault && (
                    <span className="ml-2 text-[10px] text-[var(--accent)] border border-[var(--accent)] rounded px-1">
                      default
                    </span>
                  )}
                </td>

                <td className="px-4 py-3 text-sm text-[var(--text)]">
                  {editingId === s.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-2 py-1 text-sm bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]"
                    />
                  ) : (
                    s.name
                  )}
                </td>

                <td className="px-4 py-3 text-sm text-right font-mono">
                  {editingId === s.id ? (
                    <input
                      type="number"
                      min={1}
                      max={99999}
                      value={editNextNumber}
                      onChange={(e) => setEditNextNumber(e.target.value)}
                      className="w-24 px-2 py-1 text-sm text-right bg-[var(--bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)]"
                    />
                  ) : (
                    <span className="text-[var(--text-dim)]">{s.nextNumber}</span>
                  )}
                </td>

                <td className="px-4 py-3 text-xs font-mono text-[var(--text-dim)]">
                  {seriesPreview(
                    s.code,
                    editingId === s.id ? (parseInt(editNextNumber, 10) || s.nextNumber) : s.nextNumber,
                  )}
                </td>

                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
                      s.isActive
                        ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20'
                        : 'bg-[var(--border)] text-[var(--text-dim)] border-transparent'
                    }`}
                  >
                    {s.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </td>

                <td className="px-4 py-3 text-right">
                  {editingId === s.id ? (
                    <div className="flex items-center justify-end gap-2">
                      {editError && (
                        <span className="text-xs text-[var(--danger)] max-w-[160px] text-left">
                          {editError}
                        </span>
                      )}
                      <button
                        onClick={() => saveEdit(s.id)}
                        disabled={editSaving}
                        className="text-xs px-3 py-1 bg-[var(--accent)] text-[var(--bg)] rounded hover:bg-[var(--accent-dim)] disabled:opacity-50"
                      >
                        {editSaving ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-xs px-3 py-1 border border-[var(--border)] rounded text-[var(--text-dim)] hover:text-[var(--text)]"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(s)}
                        className="text-xs text-[var(--accent)] hover:underline"
                      >
                        Editar
                      </button>
                      {s.isActive ? (
                        <button
                          onClick={() => handleDeactivate(s.id)}
                          className="text-xs text-[var(--text-dim)] hover:text-[var(--danger)] hover:underline"
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(s.id)}
                          className="text-xs text-[var(--text-dim)] hover:text-[var(--success)] hover:underline"
                        >
                          Activar
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!showCreate ? (
        <button
          onClick={() => setShowCreate(true)}
          className="text-sm text-[var(--accent)] hover:underline"
        >
          + Nueva serie
        </button>
      ) : (
        <form
          onSubmit={handleCreate}
          className="p-6 bg-[var(--surface)] border border-[var(--accent)]/30 rounded-lg space-y-4"
        >
          <h3 className="text-sm font-medium text-[var(--text)] uppercase tracking-wide">
            Nueva serie
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-[var(--text)]">Código</label>
              <input
                type="text"
                value={createCode}
                onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                placeholder="B"
                maxLength={5}
                className="w-full px-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-mono focus:outline-none focus:border-[var(--accent)]"
              />
              {createErrors.code && (
                <p className="text-xs text-[var(--danger)]">{createErrors.code[0]}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-[var(--text)]">Nombre</label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Facturas rectificativas"
                className="w-full px-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              />
              {createErrors.name && (
                <p className="text-xs text-[var(--danger)]">{createErrors.name[0]}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-[var(--text)]">Primer número</label>
              <input
                type="number"
                min={1}
                max={99999}
                value={createNext}
                onChange={(e) => setCreateNext(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-mono focus:outline-none focus:border-[var(--accent)]"
              />
              {createErrors.nextNumber && (
                <p className="text-xs text-[var(--danger)]">{createErrors.nextNumber[0]}</p>
              )}
            </div>
          </div>

          {createCode && (
            <p className="text-xs text-[var(--text-dim)] font-mono">
              Vista previa: {seriesPreview(createCode, parseInt(createNext, 10) || 1)}
            </p>
          )}

          {createError && <p className="text-sm text-[var(--danger)]">{createError}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createSaving}
              className="px-5 py-2 text-sm font-medium rounded-lg bg-[var(--accent)] text-[var(--bg)] hover:bg-[var(--accent-dim)] disabled:opacity-50 transition-colors"
            >
              {createSaving ? 'Creando...' : 'Crear serie'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false)
                setCreateErrors({})
                setCreateError(null)
              }}
              className="px-5 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

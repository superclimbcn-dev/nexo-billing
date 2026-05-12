'use client'

import { useState, useEffect, useRef } from 'react'
import { searchClientsForAutocomplete, createClientQuick } from '../_lib/item-search-action'

interface ClientOption {
  id: string
  name: string
  nif: string
  email: string | null
}

interface Props {
  value: string | null
  label: string
  onChange: (id: string, label: string) => void
}

export function ClientAutocomplete({ value, label, onChange }: Props) {
  const [query, setQuery] = useState(label)
  const [results, setResults] = useState<ClientOption[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Quick create form fields
  const [newName, setNewName] = useState('')
  const [newNif, setNewNif] = useState('')
  const [newEmail, setNewEmail] = useState('')

  useEffect(() => {
    setQuery(label)
  }, [label])

  useEffect(() => {
    if (!isOpen || query.trim().length < 2) {
      setResults([])
      return
    }
    setIsLoading(true)
    const timer = setTimeout(async () => {
      const data = await searchClientsForAutocomplete(query)
      setResults(data)
      setIsLoading(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [query, isOpen])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setShowCreateForm(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(client: ClientOption) {
    onChange(client.id, `${client.name} (${client.nif})`)
    setQuery(`${client.name} (${client.nif})`)
    setIsOpen(false)
    setShowCreateForm(false)
  }

  function openCreateForm() {
    setNewName(query.trim())
    setNewNif('')
    setNewEmail('')
    setCreateError(null)
    setShowCreateForm(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null)

    const name = newName.trim()
    if (!name) {
      setCreateError('El nombre es obligatorio')
      return
    }

    setCreating(true)
    const res = await createClientQuick({
      name,
      nif: newNif.trim() || undefined,
      email: newEmail.trim() || undefined,
    })
    setCreating(false)

    if (res.ok) {
      handleSelect(res.client)
    } else {
      setCreateError(res.error)
    }
  }

  const isSelected = Boolean(value)
  const showAddOption = query.trim().length >= 2 && !showCreateForm

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-[var(--text)] mb-1">Cliente *</label>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
          setShowCreateForm(false)
          if (isSelected) onChange('', '')
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Buscar por nombre o NIF..."
        className={`w-full px-3 py-2 bg-[var(--surface-raised)] border rounded-md focus:outline-none focus:border-[var(--accent)] transition-colors ${
          isSelected ? 'border-[var(--accent)] text-[var(--text)]' : 'border-[var(--border)] text-[var(--text)]'
        }`}
      />
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute z-10 mt-1 w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-md shadow-lg max-h-64 overflow-auto">
          {isLoading ? (
            <div className="p-3 text-sm text-[var(--text-dim)]">Buscando...</div>
          ) : showCreateForm ? (
            <form onSubmit={handleCreate} className="p-3 space-y-2">
              {createError && (
                <div className="p-2 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded">
                  <p className="text-xs text-[var(--danger)]">{createError}</p>
                </div>
              )}
              <p className="text-xs font-medium text-[var(--text)] uppercase tracking-wide">
                Añadir cliente nuevo
              </p>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre o razón social *"
                required
                className="w-full px-2 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded text-sm focus:outline-none focus:border-[var(--accent)]"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newNif}
                  onChange={(e) => setNewNif(e.target.value)}
                  placeholder="NIF / CIF"
                  className="w-full px-2 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded text-sm focus:outline-none focus:border-[var(--accent)]"
                />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-2 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-3 py-1.5 bg-[var(--accent)] text-[var(--bg)] text-xs font-medium rounded hover:bg-[var(--accent-dim)] disabled:opacity-50"
                >
                  {creating ? 'Guardando...' : 'Guardar y seleccionar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-1.5 border border-[var(--border)] text-[var(--text-dim)] text-xs rounded hover:bg-[var(--surface-hover)]"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : results.length === 0 ? (
            <div className="p-2">
              <div className="text-sm text-[var(--text-dim)] mb-2">
                Sin resultados. Puedes crear un cliente nuevo.
              </div>
              {showAddOption && (
                <button
                  onClick={openCreateForm}
                  className="w-full text-left px-3 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-md font-medium"
                >
                  + Añadir &quot;{query.trim()}&quot; como cliente
                </button>
              )}
            </div>
          ) : (
            <ul className="py-1">
              {results.map((c) => (
                <li
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className="px-3 py-2 cursor-pointer hover:bg-[var(--surface-hover)]"
                >
                  <div className="font-medium text-sm">{c.name}</div>
                  <div className="text-xs text-[var(--text-dim)] font-mono">{c.nif}</div>
                </li>
              ))}
              {showAddOption && (
                <li
                  onClick={openCreateForm}
                  className="px-3 py-2 cursor-pointer hover:bg-[var(--accent)]/10 border-t border-[var(--border)]"
                >
                  <span className="text-sm text-[var(--accent)] font-medium">
                    + Añadir &quot;{query.trim()}&quot; como cliente
                  </span>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

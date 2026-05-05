'use client'

import { useState, useEffect, useRef } from 'react'
import { searchClientsForAutocomplete } from '../_lib/item-search-action'

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
  const containerRef = useRef<HTMLDivElement>(null)

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
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(client: ClientOption) {
    onChange(client.id, `${client.name} (${client.nif})`)
    setQuery(`${client.name} (${client.nif})`)
    setIsOpen(false)
  }

  const isSelected = Boolean(value)

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-[var(--text)] mb-1">Cliente *</label>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
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
          ) : results.length === 0 ? (
            <div className="p-3 text-sm text-[var(--text-dim)]">Sin resultados</div>
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
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

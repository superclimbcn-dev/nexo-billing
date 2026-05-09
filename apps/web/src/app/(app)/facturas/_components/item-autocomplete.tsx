'use client'

import { useState, useEffect, useRef } from 'react'
import { searchItemsForAutocomplete, type ItemSearchResult } from '../_lib/item-search-action'

interface Props {
  value: string
  onItemSelected: (item: ItemSearchResult) => void
  onTextChange: (text: string) => void
}

export function ItemAutocomplete({ value, onItemSelected, onTextChange }: Props) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<ItemSearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    if (!isOpen || query.trim().length < 2) {
      setResults([])
      return
    }
    setIsLoading(true)
    const timer = setTimeout(async () => {
      const data = await searchItemsForAutocomplete(query)
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

  function handleSelect(item: ItemSearchResult) {
    onItemSelected(item)
    setQuery(item.name)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          onTextChange(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Buscar producto/servicio o escribir descripción..."
        className="w-full px-2 py-1.5 bg-[var(--surface-raised)] border border-[var(--border)] rounded-md text-sm focus:outline-none focus:border-[var(--accent)]"
      />
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-md shadow-lg max-h-64 overflow-auto">
          {isLoading ? (
            <div className="p-2 text-sm text-[var(--text-dim)]">Buscando...</div>
          ) : results.length === 0 ? (
            <div className="p-2 text-sm text-[var(--text-dim)]">
              Sin resultados en catálogo. Puedes escribir una descripción libre.
            </div>
          ) : (
            <ul className="py-1">
              {results.map((it) => (
                <li
                  key={it.id}
                  onClick={() => handleSelect(it)}
                  className="px-3 py-2 cursor-pointer hover:bg-[var(--surface-hover)] flex justify-between items-start gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate">{it.name}</span>
                      {it.source === 'catalog' && (
                        <span className="shrink-0 text-[10px] px-1.5 py-0.5 bg-[var(--accent)]/20 text-[var(--accent)] rounded-full font-medium">
                          Catálogo
                        </span>
                      )}
                    </div>
                    {it.description && (
                      <div className="text-xs text-[var(--text-dim)] truncate">
                        {it.description}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-[var(--text-dim)] font-mono whitespace-nowrap">
                    {it.unitPrice.toFixed(2).replace('.', ',')} €
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

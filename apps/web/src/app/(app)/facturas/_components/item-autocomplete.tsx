'use client'

import { useState, useEffect, useRef } from 'react'
import {
  searchItemsForAutocomplete,
  searchCatalogTopItems,
  createItemQuick,
  type ItemSearchResult,
} from '../_lib/item-search-action'

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
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Form fields for quick create
  const [newName, setNewName] = useState('')
  const [newUnitPrice, setNewUnitPrice] = useState('')
  const [newVatRate, setNewVatRate] = useState('21')
  const [newUnit, setNewUnit] = useState('ud')
  const [newType, setNewType] = useState<'product' | 'service'>('product')

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    if (!isOpen) {
      setResults([])
      setShowCreateForm(false)
      return
    }
    if (query.trim().length >= 2) {
      setIsLoading(true)
      const timer = setTimeout(async () => {
        const data = await searchItemsForAutocomplete(query)
        setResults(data)
        setIsLoading(false)
      }, 250)
      return () => clearTimeout(timer)
    }
    setIsLoading(true)
    searchCatalogTopItems().then((data) => {
      setResults(data)
      setIsLoading(false)
    })
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

  function handleSelect(item: ItemSearchResult) {
    onItemSelected(item)
    setQuery(item.name)
    setIsOpen(false)
    setShowCreateForm(false)
  }

  function openCreateForm() {
    setNewName(query.trim())
    setNewUnitPrice('')
    setNewVatRate('21')
    setNewUnit('ud')
    setNewType('product')
    setShowCreateForm(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const price = parseFloat(newUnitPrice.replace(',', '.'))
    if (!newName.trim() || isNaN(price) || price < 0) return

    setCreating(true)
    const item = await createItemQuick({
      name: newName.trim(),
      unitPrice: price,
      vatRate: parseFloat(newVatRate),
      unit: newUnit.trim() || 'ud',
      type: newType,
    })
    setCreating(false)

    if (item) {
      handleSelect(item)
    }
  }

  const showAddOption = query.trim().length >= 2 && !showCreateForm

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          onTextChange(e.target.value)
          setIsOpen(true)
          setShowCreateForm(false)
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Haz clic para ver catálogo o escribe para buscar..."
        className="w-full px-2 py-1.5 bg-[var(--surface-raised)] border border-[var(--border)] rounded-md text-sm focus:outline-none focus:border-[var(--accent)]"
      />
      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-md shadow-lg max-h-80 overflow-auto">
          {isLoading ? (
            <div className="p-2 text-sm text-[var(--text-dim)]">Buscando...</div>
          ) : showCreateForm ? (
            <form onSubmit={handleCreate} className="p-3 space-y-2">
              <p className="text-xs font-medium text-[var(--text)] uppercase tracking-wide">
                Añadir producto nuevo
              </p>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre"
                required
                className="w-full px-2 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded text-sm focus:outline-none focus:border-[var(--accent)]"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newUnitPrice}
                  onChange={(e) => setNewUnitPrice(e.target.value)}
                  placeholder="Precio"
                  inputMode="decimal"
                  required
                  className="w-full px-2 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded text-sm focus:outline-none focus:border-[var(--accent)]"
                />
                <select
                  value={newVatRate}
                  onChange={(e) => setNewVatRate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded text-sm focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="0">0%</option>
                  <option value="4">4%</option>
                  <option value="10">10%</option>
                  <option value="21">21%</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  placeholder="ud, m², kg..."
                  className="w-full px-2 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded text-sm focus:outline-none focus:border-[var(--accent)]"
                />
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as 'product' | 'service')}
                  className="w-full px-2 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded text-sm focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="product">Producto</option>
                  <option value="service">Servicio</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-3 py-1.5 bg-[var(--accent)] text-[var(--bg)] text-xs font-medium rounded hover:bg-[var(--accent-dim)] disabled:opacity-50"
                >
                  {creating ? 'Guardando...' : 'Guardar y añadir'}
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
                Sin resultados en catálogo. Puedes escribir una descripción libre o añadirlo como producto.
              </div>
              {showAddOption && (
                <button
                  onClick={openCreateForm}
                  className="w-full text-left px-3 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-md font-medium"
                >
                  + Añadir &quot;{query.trim()}&quot; como producto
                </button>
              )}
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
              {showAddOption && (
                <li
                  onClick={openCreateForm}
                  className="px-3 py-2 cursor-pointer hover:bg-[var(--accent)]/10 border-t border-[var(--border)]"
                >
                  <span className="text-sm text-[var(--accent)] font-medium">
                    + Añadir &quot;{query.trim()}&quot; como producto
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

'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

interface ItemSearchProps {
  initialSearch: string
  initialType: string
}

export function ItemSearch({ initialSearch, initialType }: ItemSearchProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [type, setType] = useState(initialType)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => {
      const params = new URLSearchParams()
      if (search.trim()) params.set('q', search.trim())
      if (type) params.set('tipo', type)
      const query = params.toString()
      router.push(`/productos${query ? `?${query}` : ''}`)
    })
  }

  const inputClass =
    'px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)]'

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        placeholder="Buscar por nombre o descripción..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={`flex-1 ${inputClass}`}
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className={`${inputClass} pr-8`}
      >
        <option value="">Todos los tipos</option>
        <option value="service">Servicios</option>
        <option value="product">Productos</option>
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

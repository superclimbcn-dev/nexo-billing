'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

export function ClientSearch({ initialValue }: { initialValue: string }) {
  const router = useRouter()
  const [value, setValue] = useState(initialValue)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => {
      const params = new URLSearchParams()
      if (value.trim()) params.set('q', value.trim())
      const query = params.toString()
      router.push(`/clientes${query ? `?${query}` : ''}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        placeholder="Buscar por nombre, NIF o email..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)]"
      />
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

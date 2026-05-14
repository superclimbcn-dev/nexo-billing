'use client'

import { useRouter } from 'next/navigation'
import { EXPENSE_CATEGORIES } from '../_lib/expense-schema'

export function ExpenseFilters() {
  const router = useRouter()

  function handleChange(key: string, value: string) {
    const params = new URLSearchParams(window.location.search)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/gastos?${params.toString()}`)
  }

  const inputClass =
    'px-3 py-1.5 bg-[var(--surface-raised)] border border-[var(--border)] rounded-md text-sm focus:outline-none focus:border-[var(--accent)] transition-colors'

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
      <select
        defaultValue=""
        onChange={(e) => handleChange('categoria', e.target.value)}
        className={inputClass}
      >
        <option value="">Todas las categorías</option>
        {EXPENSE_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat === 'ALIMENTACION' && 'Alimentación'}
            {cat === 'TRANSPORTE' && 'Transporte'}
            {cat === 'MATERIAL' && 'Material'}
            {cat === 'SERVICIOS' && 'Servicios'}
            {cat === 'OTROS' && 'Otros'}
          </option>
        ))}
      </select>

      <input
        type="date"
        onChange={(e) => handleChange('desde', e.target.value)}
        className={inputClass}
        placeholder="Desde"
      />

      <input
        type="date"
        onChange={(e) => handleChange('hasta', e.target.value)}
        className={inputClass}
        placeholder="Hasta"
      />

      <button
        onClick={() => router.push('/gastos')}
        className="px-3 py-1.5 text-sm text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors"
      >
        Limpiar
      </button>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { ExpenseForm } from './expense-form'

export function ExpenseFormWrapper() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md hover:bg-[var(--accent-dim)] transition-colors"
      >
        + Nuevo gasto
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text)]">
                Nuevo gasto
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
              >
                ✕
              </button>
            </div>
            <ExpenseForm onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}

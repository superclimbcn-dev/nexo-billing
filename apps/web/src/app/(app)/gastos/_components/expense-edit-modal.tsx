'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ExpenseForm } from './expense-form'
import { deleteExpense } from '../_lib/expense-actions'
import type { ExpenseCategory } from '../_lib/expense-schema'

interface Props {
  expense: {
    id: string
    totalAmount: number
    issuedAt: Date
    category: ExpenseCategory | null
    notes: string | null
    vendor: string | null
  }
  onClose: () => void
}

type View = 'edit' | 'confirm-delete'

export function ExpenseEditModal({ expense, onClose }: Props) {
  const router = useRouter()
  const [view, setView] = useState<View>('edit')
  const [isDeleting, startDelete] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function handleDelete() {
    setDeleteError(null)
    startDelete(async () => {
      const res = await deleteExpense(expense.id)
      if (!res.ok) {
        setDeleteError(res.error)
      } else {
        router.refresh()
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text)]">
            {view === 'edit' ? 'Editar gasto' : '¿Eliminar gasto?'}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
          >
            ✕
          </button>
        </div>

        {view === 'edit' && (
          <>
            <ExpenseForm expense={expense} onClose={onClose} />

            <div className="border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={() => setView('confirm-delete')}
                className="w-full px-4 py-2 text-sm text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-md hover:bg-[var(--danger)]/20 transition-colors"
              >
                Eliminar gasto
              </button>
            </div>
          </>
        )}

        {view === 'confirm-delete' && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text)]">
              ¿Estás seguro de eliminar este gasto? Esta acción no se puede deshacer.
            </p>

            {deleteError && (
              <div className="p-3 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-md">
                <p className="text-sm text-[var(--danger)]">{deleteError}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-[var(--danger)] text-white font-medium rounded-md hover:opacity-90 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar permanentemente'}
              </button>
              <button
                type="button"
                onClick={() => setView('edit')}
                disabled={isDeleting}
                className="px-4 py-2 border border-[var(--border)] rounded-md text-[var(--text-dim)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

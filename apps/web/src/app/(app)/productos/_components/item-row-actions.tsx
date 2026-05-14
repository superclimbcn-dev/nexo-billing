'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { softDeleteItem } from '../_lib/item-actions'

interface ItemRowActionsProps {
  itemId: string
  itemName: string
}

export function ItemRowActions({ itemId, itemName }: ItemRowActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function handleDelete() {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
      return
    }
    startTransition(async () => {
      const res = await softDeleteItem(itemId)
      if (res.ok) {
        router.refresh()
      } else {
        alert(res.error)
      }
    })
  }

  return (
    <div className="flex items-center gap-3 justify-end">
      <button
        onClick={() => router.push(`/productos/${itemId}`)}
        className="text-sm text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors"
      >
        Editar
      </button>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className={`text-sm transition-colors disabled:opacity-50 ${
          confirming
            ? 'text-[var(--danger)]'
            : 'text-[var(--text-dim)] hover:text-[var(--danger)]'
        }`}
      >
        {isPending
          ? 'Borrando...'
          : confirming
            ? `¿Borrar "${itemName}"?`
            : 'Borrar'}
      </button>
    </div>
  )
}

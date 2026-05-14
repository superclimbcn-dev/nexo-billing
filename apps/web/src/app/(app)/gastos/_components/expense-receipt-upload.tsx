'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { uploadReceipt } from '../_lib/expense-actions'

interface Props {
  expenseId: string
}

export function ExpenseReceiptUpload({ expenseId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('expenseId', expenseId)

      const res = await uploadReceipt(formData)
      if (!res.ok) {
        setError(res.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <label className="cursor-pointer text-sm text-[var(--accent)] hover:underline inline-flex items-center gap-1">
      <span>📎 Adjuntar</span>
      <input
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        onChange={handleFileChange}
        disabled={isPending}
        className="hidden"
      />
      {isPending && <span className="text-xs text-[var(--text-dim)]">Subiendo...</span>}
      {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
    </label>
  )
}

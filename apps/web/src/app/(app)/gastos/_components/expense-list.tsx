import Link from 'next/link'
import { formatCurrency, formatDate } from '@nexo/core-utils'
import type { ExpenseCategory } from '../_lib/expense-schema'
import { ExpenseReceiptUpload } from './expense-receipt-upload'

interface ExpenseItem {
  id: string
  totalAmount: number
  issuedAt: Date
  category: ExpenseCategory | null
  notes: string | null
  vendor: string | null
  attachmentUrl: string | null
}

interface Props {
  items: ExpenseItem[]
}

const categoryColors: Record<string, string> = {
  ALIMENTACION: 'bg-orange-100 text-orange-800',
  TRANSPORTE: 'bg-blue-100 text-blue-800',
  MATERIAL: 'bg-purple-100 text-purple-800',
  SERVICIOS: 'bg-green-100 text-green-800',
  OTROS: 'bg-gray-100 text-gray-800',
}

const categoryLabels: Record<string, string> = {
  ALIMENTACION: 'Alimentación',
  TRANSPORTE: 'Transporte',
  MATERIAL: 'Material',
  SERVICIOS: 'Servicios',
  OTROS: 'Otros',
}

export function ExpenseList({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-[var(--text-dim)] border border-dashed border-[var(--border)] rounded-lg">
        <p className="text-sm">No hay gastos registrados.</p>
        <p className="text-xs mt-1">Añade tu primer gasto con el botón superior.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      <table className="w-full">
        <thead className="bg-[var(--surface)] border-b border-[var(--border)]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
              Categoría
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
              Descripción
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
              Importe
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
              Recibo
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {items.map((expense) => (
            <tr key={expense.id} className="hover:bg-[var(--surface-hover)] transition-colors">
              <td className="px-4 py-3 text-sm text-[var(--text-dim)]">
                {formatDate(expense.issuedAt)}
              </td>
              <td className="px-4 py-3">
                {expense.category && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${categoryColors[expense.category] ?? categoryColors.OTROS}`}
                  >
                    {categoryLabels[expense.category] ?? expense.category}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <p className="text-sm text-[var(--text)]">
                  {expense.notes ?? '—'}
                </p>
                {expense.vendor && (
                  <p className="text-xs text-[var(--text-dim)]">{expense.vendor}</p>
                )}
              </td>
              <td className="px-4 py-3 text-sm font-mono text-[var(--text)]">
                {formatCurrency(expense.totalAmount)}
              </td>
              <td className="px-4 py-3">
                {expense.attachmentUrl ? (
                  <a
                    href={expense.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--accent)] hover:underline"
                  >
                    📎 Ver
                  </a>
                ) : (
                  <ExpenseReceiptUpload expenseId={expense.id} />
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/gastos/${expense.id}`}
                  className="text-sm text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors"
                >
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

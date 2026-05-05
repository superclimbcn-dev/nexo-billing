import { formatCurrency } from '@nexo/core-utils'
import type { Prisma } from '@nexo/prisma'

type DecimalLike = Prisma.Decimal | number

function toNum(v: DecimalLike): number {
  if (typeof v === 'number') return v
  return parseFloat(v.toString())
}

interface Line {
  id: string
  description: string
  quantity: DecimalLike
  unitPrice: DecimalLike
  vatRate: DecimalLike
  subtotal: DecimalLike
  totalAmount: DecimalLike
}

interface Props {
  lines: Line[]
}

export function InvoiceDetailLines({ lines }: Props) {
  return (
    <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
      <h2 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wide px-4 pt-4 pb-2">
        Líneas
      </h2>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border)] text-xs text-[var(--text-dim)] uppercase tracking-wider">
            <th className="text-left px-4 py-2 font-medium">Descripción</th>
            <th className="text-right px-2 py-2 font-medium">Cant.</th>
            <th className="text-right px-2 py-2 font-medium">Precio</th>
            <th className="text-right px-2 py-2 font-medium">IVA</th>
            <th className="text-right px-4 py-2 font-medium">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {lines.map((line) => (
            <tr key={line.id} className="hover:bg-[var(--surface-hover)] transition-colors">
              <td className="px-4 py-3 text-sm text-[var(--text)]">{line.description}</td>
              <td className="px-2 py-3 text-sm text-right font-mono text-[var(--text-dim)]">
                {toNum(line.quantity).toFixed(2).replace('.', ',')}
              </td>
              <td className="px-2 py-3 text-sm text-right font-mono text-[var(--text-dim)]">
                {formatCurrency(toNum(line.unitPrice))}
              </td>
              <td className="px-2 py-3 text-sm text-right font-mono text-[var(--text-dim)]">
                {Math.round(toNum(line.vatRate))}%
              </td>
              <td className="px-4 py-3 text-sm text-right font-mono text-[var(--text)]">
                {formatCurrency(toNum(line.totalAmount))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

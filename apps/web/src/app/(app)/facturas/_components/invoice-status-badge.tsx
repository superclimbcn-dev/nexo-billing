import { getStatusLabel, getStatusColor } from '../_lib/invoice-status'

export function InvoiceStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusColor(status)}`}
    >
      {getStatusLabel(status)}
    </span>
  )
}

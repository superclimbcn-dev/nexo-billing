import { getReceiptStatusLabel, getReceiptStatusColor } from '../_lib/receipt-status'

export function ReceiptStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getReceiptStatusColor(status)}`}
    >
      {getReceiptStatusLabel(status)}
    </span>
  )
}

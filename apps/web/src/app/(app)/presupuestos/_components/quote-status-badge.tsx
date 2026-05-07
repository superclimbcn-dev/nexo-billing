import { getQuoteStatusLabel, getQuoteStatusColor } from '../_lib/quote-status'

export function QuoteStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getQuoteStatusColor(status)}`}
    >
      {getQuoteStatusLabel(status)}
      {status === 'converted' && ' ✓'}
    </span>
  )
}

import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@nexo/core-auth'
import { getQuoteById } from '../_lib/quote-queries'
import { QuoteDetailHeader } from '../_components/quote-detail-header'
import { InvoiceDetailClient } from '../../facturas/[id]/_components/invoice-detail-client'
import { InvoiceDetailLines } from '../../facturas/[id]/_components/invoice-detail-lines'
import { InvoiceDetailTotals } from '../../facturas/[id]/_components/invoice-detail-totals'

interface Props {
  params: Promise<{ id: string }>
}

export default async function QuoteDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const quote = await getQuoteById(tenantId, id)
  if (!quote) notFound()

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <QuoteDetailHeader quote={quote} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <InvoiceDetailClient client={quote.client} />
          <InvoiceDetailLines lines={quote.lines} />
        </div>
        <div className="lg:col-span-1">
          <InvoiceDetailTotals
            invoice={{
              subtotal: quote.subtotal,
              vatAmount: quote.vatAmount,
              totalAmount: quote.totalAmount,
              lines: quote.lines,
            }}
          />
        </div>
      </div>

      {quote.notes && (
        <section className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <h3 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wide mb-2">
            Notas
          </h3>
          <p className="text-sm text-[var(--text)] whitespace-pre-wrap">{quote.notes}</p>
        </section>
      )}
    </div>
  )
}

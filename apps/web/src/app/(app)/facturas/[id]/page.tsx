import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@nexo/core-auth'
import { getInvoiceById } from '../_lib/invoice-queries'
import { InvoiceDetailHeader } from './_components/invoice-detail-header'
import { InvoiceDetailClient } from './_components/invoice-detail-client'
import { InvoiceDetailLines } from './_components/invoice-detail-lines'
import { InvoiceDetailTotals } from './_components/invoice-detail-totals'
import { InvoicePdfActions } from './_components/invoice-pdf-actions'

interface Props {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const invoice = await getInvoiceById(tenantId, id)
  if (!invoice) notFound()

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <InvoiceDetailHeader invoice={invoice} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <InvoiceDetailClient client={invoice.client} />
          <InvoiceDetailLines lines={invoice.lines} />
        </div>
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6 space-y-4">
            <InvoiceDetailTotals invoice={invoice} />
            <section className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
              <h2 className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide mb-3">
                Acciones
              </h2>
              <InvoicePdfActions invoiceId={invoice.id} fullNumber={invoice.fullNumber} />
            </section>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <section className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <h3 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wide mb-2">
            Notas
          </h3>
          <p className="text-sm text-[var(--text)] whitespace-pre-wrap">{invoice.notes}</p>
        </section>
      )}
    </div>
  )
}

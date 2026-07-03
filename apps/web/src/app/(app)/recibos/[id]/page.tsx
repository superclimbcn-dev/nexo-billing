import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@nexo/core-auth'
import { getReceiptById } from '../_lib/receipt-queries'
import { ReceiptDetailHeader } from '../_components/receipt-detail-header'
import { ReceiptPdfActions } from '../_components/receipt-pdf-actions'
import { InvoiceDetailClient } from '../../facturas/[id]/_components/invoice-detail-client'
import { InvoiceDetailLines } from '../../facturas/[id]/_components/invoice-detail-lines'
import { InvoiceDetailTotals } from '../../facturas/[id]/_components/invoice-detail-totals'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ReceiptDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const receipt = await getReceiptById(tenantId, id)
  if (!receipt) notFound()

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <ReceiptDetailHeader receipt={receipt} />

      <ReceiptPdfActions
        receiptId={receipt.id}
        number={receipt.number}
        totalAmount={Number(receipt.totalAmount)}
        clientEmail={receipt.client.email ?? null}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <InvoiceDetailClient client={receipt.client} />
          <InvoiceDetailLines lines={receipt.lines} />
        </div>
        <div className="lg:col-span-1">
          <InvoiceDetailTotals
            invoice={{
              subtotal: receipt.subtotal,
              vatAmount: receipt.vatAmount,
              totalAmount: receipt.totalAmount,
              lines: receipt.lines,
            }}
          />
        </div>
      </div>

      {receipt.notes && (
        <section className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <h3 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wide mb-2">
            Notas
          </h3>
          <p className="text-sm text-[var(--text)] whitespace-pre-wrap">{receipt.notes}</p>
        </section>
      )}

      {receipt.termsConditions && (
        <section className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <h3 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wide mb-2">
            Términos y condiciones
          </h3>
          <p className="text-sm text-[var(--text)] whitespace-pre-wrap">{receipt.termsConditions}</p>
        </section>
      )}
    </div>
  )
}

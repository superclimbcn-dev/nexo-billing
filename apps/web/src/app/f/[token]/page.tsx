import { notFound } from 'next/navigation'
import { prisma } from '@nexo/prisma'
import { verifyInvoiceToken } from '@/lib/public-invoice-token'

interface Props {
  params: Promise<{ token: string }>
}

export default async function PublicInvoicePage({ params }: Props) {
  const { token } = await params

  let payload: { invoiceId: string; tenantId: string }
  try {
    payload = verifyInvoiceToken(token)
  } catch {
    notFound()
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: payload.invoiceId, tenantId: payload.tenantId },
    include: { client: { select: { name: true } } },
  })

  if (!invoice) notFound()

  const total = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(invoice.totalAmount))

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
      <div className="max-w-md w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 text-center space-y-6">
        <div className="space-y-1">
          <p className="text-xs text-[var(--text-subtle)] uppercase tracking-wider">Factura</p>
          <h1 className="text-xl font-mono font-semibold text-[var(--text)]">
            {invoice.fullNumber}
          </h1>
          <p className="text-sm text-[var(--text-dim)]">{invoice.client.name}</p>
        </div>

        <p className="text-4xl font-bold text-[var(--text)]">{total}</p>

        <a
          href={`/f/${token}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block w-full px-6 py-3 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-lg hover:bg-[var(--accent-dim)] transition-colors text-sm"
        >
          Descargar PDF
        </a>

        <p className="text-xs text-[var(--text-subtle)]">
          Generado con{' '}
          <span className="text-[var(--accent-dim)] font-medium">Nexo Billing</span>
        </p>
      </div>
    </div>
  )
}

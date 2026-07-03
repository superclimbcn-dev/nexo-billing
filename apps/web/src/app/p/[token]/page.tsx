import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@nexo/prisma'
import { verifyQuoteToken } from '@/lib/public-quote-token'
import { formatCurrency, formatDate, formatNif } from '@nexo/core-utils'
import Link from 'next/link'
import { ShareButton, WhatsAppShareButton } from './_components/quote-actions'

interface Props {
  params: Promise<{ token: string }>
}

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default async function PublicQuotePage({ params }: Props) {
  const { token } = await params

  let payload: { quoteId: string; tenantId: string }
  try {
    payload = verifyQuoteToken(token)
  } catch {
    notFound()
  }

  const quote = await prisma.quote.findFirst({
    where: { id: payload.quoteId, tenantId: payload.tenantId },
    include: {
      client: true,
      lines: {
        include: { item: { select: { name: true, unit: true } } },
        orderBy: { sortOrder: 'asc' },
      },
      tenant: {
        select: {
          name: true,
          legalName: true,
          nif: true,
          fiscalAddress: true,
          fiscalCity: true,
          fiscalPostal: true,
          fiscalProvince: true,
          iban: true,
          email: true,
          phone: true,
          branding: {
            select: {
              logoUrl: true,
              primaryColor: true,
            },
          },
        },
      },
    },
  })

  if (!quote) notFound()

  const tenant = quote.tenant
  const client = quote.client
  const logoUrl = tenant.branding?.logoUrl

  const vatBreakdown = quote.lines.reduce(
    (acc, line) => {
      const rate = Number(line.vatRate)
      if (!acc[rate]) {
        acc[rate] = { base: 0, vat: 0 }
      }
      acc[rate].base += Number(line.subtotal)
      acc[rate].vat += Number(line.vatAmount)
      return acc
    },
    {} as Record<number, { base: number; vat: number }>,
  )

  const shareTitle = `Presupuesto ${quote.number} — ${tenant.name}`

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Mobile container */}
      <div className="max-w-lg mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-5 pt-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              <img src={logoUrl} alt={tenant.name} className="h-8 w-auto object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-[var(--bg)] font-bold text-sm">
                {tenant.name.charAt(0)}
              </div>
            )}
            <span className="text-sm font-medium text-[var(--text-dim)]">{tenant.name}</span>
          </div>
          <ShareButton url={`/p/${token}`} title={shareTitle} />
        </header>

        {/* Main card */}
        <main className="flex-1 px-5 pb-8 space-y-5">
          {/* Quote hero */}
          <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] text-[var(--text-subtle)] uppercase tracking-wider font-medium">
                  Presupuesto
                </p>
                <h1 className="font-mono text-lg font-semibold text-[var(--text)] mt-0.5">
                  {quote.number}
                </h1>
              </div>
              <StatusBadge status={quote.status} />
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight">
                {formatCurrency(Number(quote.totalAmount))}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] text-[var(--text-subtle)] uppercase tracking-wider">
                  Fecha
                </p>
                <p className="text-[var(--text)] font-medium mt-0.5">
                  {formatDate(quote.issuedAt)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[var(--text-subtle)] uppercase tracking-wider">
                  Válido hasta
                </p>
                <p className="text-[var(--text)] font-medium mt-0.5">
                  {formatDate(quote.validUntil)}
                </p>
              </div>
            </div>
          </section>

          {/* Parties */}
          <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
            <div>
              <p className="text-[11px] text-[var(--text-subtle)] uppercase tracking-wider mb-2">
                De
              </p>
              <p className="font-medium text-[var(--text)]">
                {tenant.legalName || tenant.name}
              </p>
              <p className="text-sm text-[var(--text-dim)] font-mono mt-0.5">
                {formatNif(tenant.nif)}
              </p>
              {tenant.fiscalAddress && (
                <p className="text-sm text-[var(--text-dim)] mt-1">
                  {tenant.fiscalAddress}
                  {tenant.fiscalCity && `, ${tenant.fiscalCity}`}
                  {tenant.fiscalPostal && ` ${tenant.fiscalPostal}`}
                </p>
              )}
            </div>

            <div className="border-t border-[var(--border)] pt-4">
              <p className="text-[11px] text-[var(--text-subtle)] uppercase tracking-wider mb-2">
                Para
              </p>
              <p className="font-medium text-[var(--text)]">
                {client.legalName || client.name}
              </p>
              <p className="text-sm text-[var(--text-dim)] font-mono mt-0.5">
                {formatNif(client.nif)}
              </p>
              {client.address && (
                <p className="text-sm text-[var(--text-dim)] mt-1">
                  {client.address}
                  {client.city && `, ${client.city}`}
                  {client.postalCode && ` ${client.postalCode}`}
                </p>
              )}
            </div>
          </section>

          {/* Lines */}
          <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
            <p className="text-[11px] text-[var(--text-subtle)] uppercase tracking-wider mb-4">
              Conceptos
            </p>
            <div className="space-y-4">
              {quote.lines.map((line) => (
                <div
                  key={line.id}
                  className="flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)]">
                      {line.description}
                    </p>
                    <p className="text-xs text-[var(--text-dim)] mt-0.5">
                      {Number(line.quantity)} x {formatCurrency(Number(line.unitPrice))}
                      {line.item?.unit && ` / ${line.item.unit}`}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-[var(--text)] whitespace-nowrap">
                    {formatCurrency(Number(line.subtotal))}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--border)] mt-5 pt-4 space-y-2">
              {Object.entries(vatBreakdown).map(([rate, amounts]) => (
                <div key={rate} className="flex justify-between text-sm">
                  <span className="text-[var(--text-dim)]">IVA {rate}%</span>
                  <span className="text-[var(--text)]">
                    {formatCurrency(amounts.vat)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-1">
                <span className="text-[var(--text-dim)]">Base imponible</span>
                <span className="text-[var(--text)]">
                  {formatCurrency(Number(quote.subtotal))}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-[var(--border)]">
                <span className="text-[var(--text)]">Total</span>
                <span className="text-[var(--text)]">
                  {formatCurrency(Number(quote.totalAmount))}
                </span>
              </div>
            </div>
          </section>

          {/* Actions */}
          <section className="space-y-3">
            <a
              href={`/p/${token}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-[var(--accent)] text-[var(--bg)] font-semibold rounded-xl hover:bg-[var(--accent-dim)] transition-colors text-sm"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Descargar PDF
            </a>

            {quote.termsConditions && (
              <div className="p-4 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl">
                <p className="text-sm font-medium text-[var(--text)] mb-1">
                  Términos y condiciones
                </p>
                <p className="text-xs text-[var(--text-dim)] whitespace-pre-wrap">
                  {quote.termsConditions}
                </p>
              </div>
            )}

            <WhatsAppShareButton
              quoteNumber={quote.number}
              tenantName={tenant.name}
            />
          </section>

          {/* Footer */}
          <footer className="text-center pt-4 pb-6">
            <p className="text-xs text-[var(--text-subtle)]">
              Generado con{' '}
              <Link href="/" className="text-[var(--accent-dim)] font-medium hover:underline">
                Nexo Billing
              </Link>
            </p>
            <p className="text-[10px] text-[var(--text-subtle)] mt-1 opacity-60">
              Nexo Billing · Facturación digital
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-[var(--text-subtle)]/10 text-[var(--text-dim)]',
    sent: 'bg-[var(--accent)]/10 text-[var(--accent)]',
    accepted: 'bg-[var(--success)]/10 text-[var(--success)]',
    rejected: 'bg-[var(--danger)]/10 text-[var(--danger)]',
    expired: 'bg-[var(--warning)]/10 text-[var(--warning)]',
    converted: 'bg-[var(--success)]/10 text-[var(--success)]',
  }

  const labels: Record<string, string> = {
    draft: 'Borrador',
    sent: 'Enviado',
    accepted: 'Aceptado',
    rejected: 'Rechazado',
    expired: 'Expirado',
    converted: 'Convertido',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] ?? styles.draft}`}
    >
      {labels[status] ?? status}
    </span>
  )
}

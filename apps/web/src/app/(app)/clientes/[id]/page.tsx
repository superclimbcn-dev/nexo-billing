import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@nexo/core-auth'
import { formatCurrency, formatDate, formatNif, formatPhone } from '@nexo/core-utils'
import { getClientDetail } from '../_lib/client-queries'
import { InvoiceStatusBadge } from '../../facturas/_components/invoice-status-badge'
import { QuoteStatusBadge } from '../../presupuestos/_components/quote-status-badge'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: PageProps) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const { id } = await params
  const detail = await getClientDetail(tenantId, id)
  if (!detail) notFound()

  const { client, totalInvoiced, pendingAmount, lastInvoiceAt, recentInvoices, invoiceCount, recentQuotes, quoteCount } = detail

  const addressLine2 = [client.postalCode, client.city].filter(Boolean).join(' ')

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Back + Header */}
      <div>
        <Link
          href="/clientes"
          className="text-sm text-[var(--text-subtle)] hover:text-[var(--text)] transition-colors"
        >
          ← Clientes
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
              {client.legalName || client.name}
            </h1>
            {client.legalName && client.legalName !== client.name && (
              <p className="text-sm text-[var(--text-dim)] mt-0.5">{client.name}</p>
            )}
          </div>
          <Link
            href={`/clientes/${client.id}/editar`}
            className="px-3 py-1.5 border border-[var(--border)] rounded-md text-sm text-[var(--text-dim)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors"
          >
            Editar cliente
          </Link>
        </div>
      </div>

      {/* Two-column: info + stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: client data */}
        <div className="lg:col-span-2 p-5 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-3">
          <DataRow label="NIF / CIF" value={formatNif(client.nif)} mono />
          {client.address && <DataRow label="Dirección" value={client.address} />}
          {addressLine2 && <DataRow label="Localidad" value={addressLine2} />}
          {client.province && <DataRow label="Provincia" value={client.province} />}
          {client.email && (
            <div className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
              <span className="text-sm text-[var(--text-subtle)]">Email</span>
              <a
                href={`mailto:${client.email}`}
                className="text-sm text-[var(--accent)] hover:underline"
              >
                {client.email}
              </a>
            </div>
          )}
          {client.phone && (
            <div className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
              <span className="text-sm text-[var(--text-subtle)]">Teléfono</span>
              <a
                href={`tel:${client.phone}`}
                className="text-sm text-[var(--text)] hover:text-[var(--accent)] transition-colors"
              >
                {formatPhone(client.phone)}
              </a>
            </div>
          )}
          {client.contactPerson && (
            <DataRow label="Contacto" value={client.contactPerson} />
          )}
          {client.notes && (
            <div className="pt-2">
              <p className="text-xs text-[var(--text-subtle)] uppercase tracking-wider mb-1">Notas</p>
              <p className="text-sm text-[var(--text-dim)] whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Right: stats */}
        <div className="space-y-4">
          <StatCard
            label="Total facturado"
            value={totalInvoiced > 0 ? formatCurrency(totalInvoiced) : '—'}
            accent={totalInvoiced > 0}
          />
          <StatCard
            label="Pendiente de cobro"
            value={pendingAmount > 0 ? formatCurrency(pendingAmount) : '—'}
            warning={pendingAmount > 0}
          />
          <StatCard
            label="Última factura"
            value={lastInvoiceAt ? formatDate(lastInvoiceAt) : 'Sin facturas'}
          />
        </div>
      </div>

      {/* Invoice history */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wider">
            Facturas{invoiceCount > 0 && ` (${invoiceCount})`}
          </h2>
          {invoiceCount > 10 && (
            <Link
              href={`/facturas?clientId=${client.id}`}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Ver todas →
            </Link>
          )}
        </div>
        {recentInvoices.length === 0 ? (
          <p className="text-sm text-[var(--text-subtle)] py-4">Sin facturas todavía.</p>
        ) : (
          <div className="rounded-lg border border-[var(--border)] overflow-hidden">
            <table className="w-full">
              <thead className="bg-[var(--surface)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">Número</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">Total</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="px-4 py-2.5">
                      <Link href={`/facturas/${inv.id}`} className="font-mono text-sm text-[var(--text)] hover:text-[var(--accent)] transition-colors">
                        {inv.fullNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-[var(--text-dim)]">{formatDate(inv.issuedAt)}</td>
                    <td className="px-4 py-2.5 text-sm font-mono text-[var(--text)] text-right">{formatCurrency(Number(inv.totalAmount))}</td>
                    <td className="px-4 py-2.5"><InvoiceStatusBadge status={inv.status} /></td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/facturas/${inv.id}`} className="text-sm text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors">Ver</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Quote history */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wider">
            Presupuestos{quoteCount > 0 && ` (${quoteCount})`}
          </h2>
          {quoteCount > 10 && (
            <Link
              href={`/presupuestos?clientId=${client.id}`}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Ver todos →
            </Link>
          )}
        </div>
        {recentQuotes.length === 0 ? (
          <p className="text-sm text-[var(--text-subtle)] py-4">Sin presupuestos todavía.</p>
        ) : (
          <div className="rounded-lg border border-[var(--border)] overflow-hidden">
            <table className="w-full">
              <thead className="bg-[var(--surface)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">Número</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">Total</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {recentQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="px-4 py-2.5">
                      <Link href={`/presupuestos/${q.id}`} className="font-mono text-sm text-[var(--text)] hover:text-[var(--accent)] transition-colors">
                        {q.number}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-[var(--text-dim)]">{formatDate(q.issuedAt)}</td>
                    <td className="px-4 py-2.5 text-sm font-mono text-[var(--text)] text-right">{formatCurrency(Number(q.totalAmount))}</td>
                    <td className="px-4 py-2.5"><QuoteStatusBadge status={q.status} /></td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/presupuestos/${q.id}`} className="text-sm text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors">Ver</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function DataRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
      <span className="text-sm text-[var(--text-subtle)]">{label}</span>
      <span className={`text-sm text-[var(--text)] ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
  warning,
}: {
  label: string
  value: string
  accent?: boolean
  warning?: boolean
}) {
  return (
    <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
      <p className="text-xs text-[var(--text-subtle)] uppercase tracking-wider mb-2">{label}</p>
      <p
        className={`text-xl font-semibold ${
          accent
            ? 'text-[var(--accent)]'
            : warning
              ? 'text-[var(--warning)]'
              : 'text-[var(--text)]'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

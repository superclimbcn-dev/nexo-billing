import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@nexo/core-auth'
import { formatDate, formatCurrency } from '@nexo/core-utils'
import { getContractById, frequencyLabel } from '../_lib/recurring-queries'
import { ContractStatusBadge } from '../_components/contract-status-badge'
import { ContractDetailActions } from '../_components/contract-detail-actions'
import { InvoiceStatusBadge } from '../../facturas/_components/invoice-status-badge'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ContractDetailPage({ params }: PageProps) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const { id } = await params
  const contract = await getContractById(tenantId, id)
  if (!contract) notFound()

  const clientName = contract.client.legalName || contract.client.name

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-3">
        <Link
          href="/recurrentes"
          className="text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
        >
          ← Volver a recurrentes
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
              {contract.name}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <ContractStatusBadge status={contract.status} />
              <span className="text-sm text-[var(--text-dim)]">{clientName}</span>
              <span className="text-sm text-[var(--text-dim)]">
                · {frequencyLabel(contract.frequency)}
              </span>
            </div>
          </div>
          <ContractDetailActions contractId={contract.id} status={contract.status} />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: contract info + lines */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info */}
          <section className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-3">
            <h2 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wide">
              Información
            </h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <DataRow label="Cliente" value={clientName} />
              <DataRow label="NIF" value={contract.client.nif} />
              <DataRow label="Frecuencia" value={frequencyLabel(contract.frequency)} />
              <DataRow label="Serie" value={contract.seriesCode} />
              <DataRow label="Fecha inicio" value={formatDate(contract.startDate)} />
              <DataRow
                label="Fecha fin"
                value={contract.endDate ? formatDate(contract.endDate) : 'Indefinido'}
              />
              <DataRow label="Próxima emisión" value={formatDate(contract.nextBillingAt)} />
              {contract.notes && <DataRow label="Notas" value={contract.notes} />}
            </div>
          </section>

          {/* Lines */}
          <section className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
            <h2 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wide mb-3">
              Líneas
            </h2>
            <div className="hidden md:grid grid-cols-12 gap-2 px-2 text-xs text-[var(--text-dim)] uppercase tracking-wide mb-2">
              <div className="col-span-5">Descripción</div>
              <div className="col-span-2 text-right">Cant.</div>
              <div className="col-span-2 text-right">Precio</div>
              <div className="col-span-2 text-right">IVA</div>
              <div className="col-span-1 text-right">Total</div>
            </div>
            <div className="space-y-2">
              {contract.lines.map((line) => (
                <div
                  key={line.id}
                  className="grid grid-cols-12 gap-2 px-2 py-2 text-sm border border-[var(--border)] rounded-md"
                >
                  <div className="col-span-12 md:col-span-5 text-[var(--text)]">
                    {line.description}
                  </div>
                  <div className="col-span-4 md:col-span-2 text-right text-[var(--text-dim)]">
                    {Number(line.quantity)}
                  </div>
                  <div className="col-span-4 md:col-span-2 text-right text-[var(--text-dim)] font-mono">
                    {formatCurrency(Number(line.unitPrice))}
                  </div>
                  <div className="col-span-4 md:col-span-2 text-right text-[var(--text-dim)]">
                    {Number(line.taxRate)}%
                  </div>
                  <div className="col-span-12 md:col-span-1 text-right font-mono text-[var(--text)]">
                    {formatCurrency(Number(line.total))}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-1 text-sm">
              <div className="flex justify-between text-[var(--text-dim)]">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(Number(contract.subtotal))}</span>
              </div>
              <div className="flex justify-between text-[var(--text-dim)]">
                <span>IVA</span>
                <span className="font-mono">{formatCurrency(Number(contract.taxAmount))}</span>
              </div>
              <div className="flex justify-between text-[var(--text)] font-semibold text-base border-t border-[var(--border)] pt-2 mt-2">
                <span>Total / ciclo</span>
                <span className="font-mono">{formatCurrency(Number(contract.total))}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right: generated invoices */}
        <div className="lg:col-span-1">
          <section className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-3">
            <h2 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wide">
              Facturas generadas
            </h2>
            {contract.invoices.length === 0 ? (
              <p className="text-sm text-[var(--text-dim)]">Sin facturas aún.</p>
            ) : (
              <div className="space-y-2">
                {contract.invoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/facturas/${inv.id}`}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-[var(--surface-hover)] transition-colors gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--text)] truncate">
                        {inv.fullNumber}
                      </div>
                      <div className="text-xs text-[var(--text-dim)]">
                        {formatDate(inv.issuedAt)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-sm font-mono text-[var(--text)]">
                        {formatCurrency(Number(inv.totalAmount))}
                      </span>
                      <InvoiceStatusBadge status={inv.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--text-dim)]">{label}</dt>
      <dd className="font-medium text-[var(--text)] mt-0.5">{value}</dd>
    </div>
  )
}

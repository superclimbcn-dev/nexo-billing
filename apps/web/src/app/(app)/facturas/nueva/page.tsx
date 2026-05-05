import { redirect } from 'next/navigation'
import { createServerClient } from '@nexo/core-auth'
import { listSeriesForTenant } from '../_lib/invoice-numbering'
import { InvoiceForm } from '../_components/invoice-form'

export default async function NuevaFacturaPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const series = await listSeriesForTenant(tenantId)

  if (series.length === 0) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl">
        <header>
          <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
            Nueva factura
          </h1>
        </header>
        <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <p className="text-[var(--text-dim)]">
            No hay series de facturación configuradas para este tenant. Contacta con
            soporte para activar la numeración.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <header>
        <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
          Nueva factura
        </h1>
        <p className="text-sm text-[var(--text-dim)] mt-1">
          Selecciona un cliente y añade las líneas. Se guardará como borrador.
        </p>
      </header>
      <InvoiceForm series={series} />
    </div>
  )
}

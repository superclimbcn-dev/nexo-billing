import { redirect } from 'next/navigation'
import { createServerClient } from '@nexo/core-auth'
import { ReceiptForm } from '../_components/receipt-form'

export default async function NuevoReciboPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <header>
        <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
          Nuevo recibo
        </h1>
        <p className="text-sm text-[var(--text-dim)] mt-1">
          Selecciona un cliente y añade las líneas. Se guardará como borrador.
        </p>
      </header>
      <ReceiptForm />
    </div>
  )
}

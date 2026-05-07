import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@nexo/core-auth'
import { getClientById } from '../../_lib/client-queries'
import { ClientForm } from '../../_components/client-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditarClientePage({ params }: PageProps) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const { id } = await params
  const client = await getClientById(tenantId, id)
  if (!client) notFound()

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <header>
        <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
          Editar cliente
        </h1>
        <p className="text-sm text-[var(--text-dim)] mt-1">{client.legalName || client.name}</p>
      </header>
      <ClientForm mode="edit" clientId={client.id} initialData={client} />
    </div>
  )
}

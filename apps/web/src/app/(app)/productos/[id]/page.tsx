import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@nexo/core-auth'
import { getItemById } from '../_lib/item-queries'
import { ItemForm } from '../_components/item-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditItemPage({ params }: PageProps) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const { id } = await params
  const item = await getItemById(tenantId, id)
  if (!item) notFound()

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <header>
        <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
          Editar producto
        </h1>
        <p className="text-sm text-[var(--text-dim)] mt-1">{item.name}</p>
      </header>
      <ItemForm mode="edit" itemId={item.id} initialData={item} />
    </div>
  )
}

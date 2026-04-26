import { redirect } from 'next/navigation'
import { FormInput, Button } from '@nexo/core-ui'
import { createServerClient } from '@nexo/core-auth'
import { setOnboardingState } from '@/actions/onboarding'

interface PageProps {
  searchParams: Promise<{ error?: string }>
}

async function saveAndContinue(formData: FormData) {
  'use server'
  await setOnboardingState({
    nombre: formData.get('nombre'),
    cargo: formData.get('cargo'),
  })
  redirect('/onboarding/empresa')
}

export default async function CuentaPage({ searchParams }: PageProps) {
  const { error } = await searchParams

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const saved = (user?.user_metadata?.onboarding_state as Record<string, string>) ?? {}

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-[var(--text-subtle)] text-sm mb-1">Paso 1 de 5</p>
        <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
          Cuéntanos sobre ti
        </h1>
        <p className="text-[var(--text-dim)] text-sm mt-2">
          Estos datos aparecerán en tus facturas como emisor.
        </p>
      </div>

      {error && (
        <p className="text-sm text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-xl px-3 py-2.5">
          {decodeURIComponent(error)}
        </p>
      )}

      <form action={saveAndContinue} className="flex flex-col gap-4">
        <FormInput
          id="nombre"
          name="nombre"
          type="text"
          label="Nombre completo"
          placeholder="María García López"
          defaultValue={saved.nombre ?? (user?.user_metadata?.name as string) ?? ''}
          autoComplete="name"
          required
        />
        <FormInput
          id="cargo"
          name="cargo"
          type="text"
          label="Cargo (opcional)"
          placeholder="Autónoma · Directora · Gerente"
          defaultValue={saved.cargo ?? ''}
          autoComplete="organization-title"
        />
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary">
            Siguiente →
          </Button>
        </div>
      </form>
    </div>
  )
}

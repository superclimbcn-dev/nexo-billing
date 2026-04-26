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
    direccion: formData.get('direccion'),
    ciudad: formData.get('ciudad'),
    cp: formData.get('cp'),
    provincia: formData.get('provincia'),
    pais: formData.get('pais'),
  })
  redirect('/onboarding/vertical')
}

export default async function DatosFiscalesPage({ searchParams }: PageProps) {
  const { error } = await searchParams

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const saved = (user?.user_metadata?.onboarding_state as Record<string, string>) ?? {}

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-[var(--text-subtle)] text-sm mb-1">Paso 3 de 5</p>
        <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
          Dirección fiscal
        </h1>
        <p className="text-[var(--text-dim)] text-sm mt-2">
          Aparecerá en el encabezado de todas tus facturas.
        </p>
      </div>

      {error && (
        <p className="text-sm text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-xl px-3 py-2.5">
          {decodeURIComponent(error)}
        </p>
      )}

      <form action={saveAndContinue} className="flex flex-col gap-4">
        <FormInput
          id="direccion"
          name="direccion"
          type="text"
          label="Dirección"
          placeholder="Calle Mayor, 12, 3º B"
          defaultValue={saved.direccion ?? ''}
          autoComplete="street-address"
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            id="cp"
            name="cp"
            type="text"
            label="Código postal"
            placeholder="08001"
            defaultValue={saved.cp ?? ''}
            autoComplete="postal-code"
            required
          />
          <FormInput
            id="ciudad"
            name="ciudad"
            type="text"
            label="Ciudad"
            placeholder="Barcelona"
            defaultValue={saved.ciudad ?? ''}
            autoComplete="address-level2"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            id="provincia"
            name="provincia"
            type="text"
            label="Provincia"
            placeholder="Barcelona"
            defaultValue={saved.provincia ?? ''}
            autoComplete="address-level1"
            required
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pais" className="text-xs text-[var(--text-dim)]">
              País
            </label>
            <select
              id="pais"
              name="pais"
              defaultValue={saved.pais ?? 'ES'}
              className="bg-[var(--bg)] border border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-[var(--text)] text-sm outline-none transition-colors duration-150 focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)]"
            >
              <option value="ES">España</option>
              <option value="PT">Portugal</option>
              <option value="FR">Francia</option>
              <option value="DE">Alemania</option>
              <option value="IT">Italia</option>
              <option value="NL">Países Bajos</option>
              <option value="GB">Reino Unido</option>
              <option value="US">Estados Unidos</option>
              <option value="MX">México</option>
              <option value="AR">Argentina</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between pt-2">
          <a href="/onboarding/empresa">
            <Button type="button" variant="secondary">
              ← Atrás
            </Button>
          </a>
          <Button type="submit" variant="primary">
            Siguiente →
          </Button>
        </div>
      </form>
    </div>
  )
}

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
    tipo: formData.get('tipo'),
    nif: formData.get('nif'),
    razonSocial: formData.get('razonSocial'),
  })
  redirect('/onboarding/datos-fiscales')
}

const TIPOS = [
  { value: 'autonomo', label: 'Autónomo / Profesional' },
  { value: 'sl', label: 'Sociedad Limitada (S.L.)' },
  { value: 'sa', label: 'Sociedad Anónima (S.A.)' },
  { value: 'cooperativa', label: 'Cooperativa' },
  { value: 'otro', label: 'Otro' },
]

export default async function EmpresaPage({ searchParams }: PageProps) {
  const { error } = await searchParams

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const saved = (user?.user_metadata?.onboarding_state as Record<string, string>) ?? {}

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-[var(--text-subtle)] text-sm mb-1">Paso 2 de 5</p>
        <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
          Tu empresa
        </h1>
        <p className="text-[var(--text-dim)] text-sm mt-2">
          Datos fiscales que identifican tu empresa ante Hacienda.
        </p>
      </div>

      {error && (
        <p className="text-sm text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-xl px-3 py-2.5">
          {decodeURIComponent(error)}
        </p>
      )}

      <form action={saveAndContinue} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="tipo" className="text-xs text-[var(--text-dim)]">
            Forma jurídica
          </label>
          <select
            id="tipo"
            name="tipo"
            defaultValue={saved.tipo ?? 'autonomo'}
            required
            className="bg-[var(--bg)] border border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-[var(--text)] text-sm outline-none transition-colors duration-150 focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)]"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <FormInput
          id="nif"
          name="nif"
          type="text"
          label="NIF / CIF"
          placeholder="B12345678 · 12345678A"
          defaultValue={saved.nif ?? ''}
          required
        />
        <FormInput
          id="razonSocial"
          name="razonSocial"
          type="text"
          label="Razón social / Nombre fiscal"
          placeholder="Servicios García S.L."
          defaultValue={saved.razonSocial ?? ''}
          required
        />

        <div className="flex justify-between pt-2">
          <Button type="button" variant="secondary" onClick={undefined}>
            <a href="/onboarding/cuenta">← Atrás</a>
          </Button>
          <Button type="submit" variant="primary">
            Siguiente →
          </Button>
        </div>
      </form>
    </div>
  )
}

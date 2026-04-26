import { redirect } from 'next/navigation'
import { createServerClient } from '@nexo/core-auth'
import { setOnboardingState } from '@/actions/onboarding'
import { VerticalSelector } from './vertical-selector'

async function saveAndContinue(formData: FormData) {
  'use server'
  await setOnboardingState({ vertical: formData.get('vertical') })
  redirect('/onboarding/configuracion')
}

export default async function VerticalPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const saved = (user?.user_metadata?.onboarding_state as Record<string, string>) ?? {}

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-[var(--text-subtle)] text-sm mb-1">Paso 4 de 5</p>
        <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
          ¿A qué te dedicas?
        </h1>
        <p className="text-[var(--text-dim)] text-sm mt-2">
          Personalizamos la plataforma para tu sector.
        </p>
      </div>

      <form action={saveAndContinue}>
        <VerticalSelector defaultValue={saved.vertical ?? 'generic'} />
      </form>
    </div>
  )
}

'use server'

import { redirect } from 'next/navigation'
import { createServerClient, createAdminClient } from '@nexo/core-auth'
import { prisma, UserRole } from '@nexo/prisma'

export async function setOnboardingState(partialState: Record<string, unknown>) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const current = (user.user_metadata?.onboarding_state as Record<string, unknown>) ?? {}
  await supabase.auth.updateUser({
    data: { onboarding_state: { ...current, ...partialState } },
  })
}

interface CompletionData {
  regimenIva: string
  ivaDefault: string
  anioFiscal: string
  emailNotificaciones: string
}

export async function completeOnboarding(formData: FormData) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const state = (user.user_metadata?.onboarding_state as Record<string, unknown>) ?? {}

  const data: CompletionData = {
    regimenIva: formData.get('regimenIva') as string,
    ivaDefault: formData.get('ivaDefault') as string,
    anioFiscal: formData.get('anioFiscal') as string,
    emailNotificaciones: (formData.get('emailNotificaciones') as string) || (user.email ?? ''),
  }

  const acceptedTyC = formData.get('acceptedTyC') === 'on'
  if (!acceptedTyC) {
    redirect('/onboarding/configuracion?error=Debes+aceptar+los+T%C3%A9rminos+y+Condiciones')
  }

  const nif = (state.nif as string) ?? ''
  const razonSocial = (state.razonSocial as string) ?? ''
  const vertical = (state.vertical as string) ?? 'generic'
  const nombre = (state.nombre as string) ?? (user.user_metadata?.name as string) ?? ''

  if (!nif || !razonSocial) {
    redirect('/onboarding/empresa?error=Faltan+datos+obligatorios')
  }

  const adminClient = createAdminClient()

  const tenant = await prisma.$transaction(async (tx) => {
    const newTenant = await tx.tenant.create({
      data: {
        name: razonSocial,
        nif,
        vertical,
        plan: 'free',
        sectorMetadata: {
          tipo: (state.tipo as string) ?? null,
          direccion: (state.direccion as string) ?? null,
          ciudad: (state.ciudad as string) ?? null,
          cp: (state.cp as string) ?? null,
          provincia: (state.provincia as string) ?? null,
          pais: (state.pais as string) ?? 'ES',
          regimenIva: data.regimenIva,
          ivaDefault: data.ivaDefault,
          anioFiscal: data.anioFiscal,
          emailNotificaciones: data.emailNotificaciones,
        },
      },
    })

    await tx.user.create({
      data: {
        id: user.id,
        tenantId: newTenant.id,
        email: user.email ?? '',
        name: nombre,
        role: UserRole.OWNER,
      },
    })

    return newTenant
  })

  await adminClient.auth.admin.updateUserById(user.id, {
    app_metadata: {
      tenant_id: tenant.id,
      role: UserRole.OWNER,
    },
  })

  await supabase.auth.updateUser({
    data: {
      onboarding_complete: true,
      onboarding_state: null,
    },
  })

  redirect('/dashboard')
}

'use server'

import { randomUUID } from 'crypto'
import { redirect } from 'next/navigation'
import { createServerClient, createAdminClient } from '@nexo/core-auth'
import { prisma, Prisma, UserRole, AuditAction } from '@nexo/prisma'
import { registerEmisorIfEnabled } from '@nexo/verifactu'

function onboardingError(message: string): never {
  redirect(`/onboarding/configuracion?error=${encodeURIComponent(message)}`)
}

function getFriendlyOnboardingError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return 'Ya existe una cuenta registrada con esos datos. Revisa el NIF o inicia sesión con tu cuenta.'
    }

    if (error.code === 'P2025') {
      return 'No hemos podido completar el registro porque falta una configuración interna. Vuelve a intentarlo en unos minutos.'
    }

    if (error.code === 'P2022') {
      return 'Estamos terminando de actualizar el sistema. Vuelve a intentarlo en unos minutos.'
    }
  }

  return 'No hemos podido completar el registro. Revisa los datos e inténtalo de nuevo.'
}

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
  const nombre = (state.nombre as string) ?? (user.user_metadata?.name as string) ?? ''
  const verticalSlug = (state.vertical as string | null) || null
  const businessType = (state.businessType as string | null) || null
  const cnae = (state.cnae as string | null) || null
  const isOtherSector = !verticalSlug || verticalSlug === 'other'

  if (!nif || !razonSocial) {
    redirect('/onboarding/empresa?error=Faltan+datos+obligatorios')
  }

  if (!isOtherSector) {
    const selectedVertical = await prisma.vertical.findUnique({
      where: { slug: verticalSlug! },
      select: { id: true },
    })

    if (!selectedVertical) {
      onboardingError('Este sector no está disponible temporalmente. Elige Genérico para completar el registro.')
    }
  }

  // Pre-generate tenant ID so we can use the batch form of $transaction.
  // The batch form (array of operations) does not require advisory locks and is
  // fully compatible with pgbouncer in transaction mode on Vercel serverless.
  const tenantId = randomUUID()
  const currentYear = new Date().getFullYear()

  try {
    await prisma.$transaction([
      // 1. Tenant — vertical via FK connect, or omitted for "Otro sector"
      prisma.tenant.create({
        data: {
          id: tenantId,
          name: razonSocial,
          nif,
          businessType: businessType || null,
          cnae: cnae || null,
          plan: 'free',
          subscriptionStatus: 'TRIAL',
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          country: 'ES',
          currency: 'EUR',
          ...(isOtherSector ? {} : { vertical: { connect: { slug: verticalSlug! } } }),
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
      }),

      // 2. User OWNER
      prisma.user.create({
        data: {
          id: user.id,
          tenantId,
          email: user.email ?? '',
          name: nombre,
          role: UserRole.OWNER,
        },
      }),

      // 3. BrandingConfig default (ADR-003) — all fields take schema defaults
      prisma.brandingConfig.create({
        data: { tenantId },
      }),

      // 4. Default invoice series: A (standard) + R (rectificativas) — ADR-004
      prisma.invoiceSeries.createMany({
        data: [
          {
            tenantId,
            code: 'A',
            name: 'Facturas estándar',
            prefix: 'A-',
            suffix: `/${currentYear}`,
            numberFormat: '0000',
            nextNumber: 1,
            isDefault: true,
            resetYearly: true,
            yearOfNumbering: currentYear,
          },
          {
            tenantId,
            code: 'R',
            name: 'Rectificativas',
            prefix: 'R-',
            suffix: `/${currentYear}`,
            numberFormat: '0000',
            nextNumber: 1,
            isDefault: false,
            resetYearly: true,
            yearOfNumbering: currentYear,
          },
        ],
      }),

      // 5. AuditLog entry for tenant creation (ADR-005)
      prisma.auditLog.create({
        data: {
          tenantId,
          userId: user.id,
          action: AuditAction.TENANT_CREATED,
          entityType: 'Tenant',
          entityId: tenantId,
          after: {
            name: razonSocial,
            nif,
            verticalSlug: isOtherSector ? null : verticalSlug,
          },
        },
      }),

      // 6. VerticalRequest if "Otro sector" chosen — ADR-002
      ...(isOtherSector && businessType
        ? [
            prisma.verticalRequest.create({
              data: {
                tenantId,
                businessTypeRequested: businessType,
                cnae: cnae || null,
                notifyOnLaunch: true,
              },
            }),
          ]
        : []),
    ])
  } catch (err) {
    console.error('Onboarding completion failed', err)
    onboardingError(getFriendlyOnboardingError(err))
  }

  const adminClient = createAdminClient()

  await adminClient.auth.admin.updateUserById(user.id, {
    app_metadata: {
      tenant_id: tenantId,
      role: UserRole.OWNER,
    },
  })

  // Fire-and-forget: register the tenant NIF in Verifacti.
  // Never blocks onboarding — errors are logged, not surfaced.
  void registerEmisorIfEnabled(nif, razonSocial)

  await supabase.auth.updateUser({
    data: {
      onboarding_complete: true,
      onboarding_state: null,
    },
  })

  redirect('/dashboard')
}

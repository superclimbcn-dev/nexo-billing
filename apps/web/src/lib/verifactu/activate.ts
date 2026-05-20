import { prisma } from '@nexo/prisma'
import { createProvider } from '@nexo/verifactu'
import { VerifactiProvider } from '@nexo/verifactu'
import { sendInternalAlert } from '@/lib/internal-alerts'

interface TenantActivation {
  id: string
  nif: string
  legalName: string | null
  name: string
}

/**
 * Activates the Verifacti provider for a tenant once their SEPA subscription is confirmed.
 * Registers the NIF with Verifacti and updates the DB fields.
 * Never throws — on API failure the subscription stays ACTIVE but verifactuNifRegistered=false
 * so the operator can retry manually.
 */
export async function activateVerifactuForTenant(tenant: TenantActivation): Promise<void> {
  let nifRegistered = false

  if (process.env.VERIFACTU_API_KEY) {
    try {
      const provider = createProvider({ tenantProvider: 'verifacti' })
      if (provider instanceof VerifactiProvider) {
        await provider.registerEmisor(tenant.nif, tenant.legalName ?? tenant.name)
        nifRegistered = true
      }
    } catch (err) {
      console.error(
        '[verifactu] activateVerifactuForTenant — NIF registration failed, will mark for manual review:',
        err instanceof Error ? err.message : err,
      )
      await sendInternalAlert({
        title: 'Error al activar Verifactu para un tenant suscrito',
        stage: 'verifactu.activate_tenant',
        severity: 'critical',
        tenant: { id: tenant.id, name: tenant.legalName ?? tenant.name, nif: tenant.nif },
        error: err,
        details: {
          action: 'registerEmisor',
          expectedProvider: 'verifacti',
        },
      })
    }
  } else {
    console.warn('[verifactu] VERIFACTU_API_KEY not set — skipping NIF registration')
    await sendInternalAlert({
      title: 'VERIFACTU_API_KEY no está configurada para activar un tenant suscrito',
      stage: 'verifactu.activate_tenant.missing_api_key',
      severity: 'critical',
      tenant: { id: tenant.id, name: tenant.legalName ?? tenant.name, nif: tenant.nif },
    })
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      verifactuProvider: nifRegistered ? 'verifacti' : 'mock',
      verifactuNifRegistered: nifRegistered,
    },
  })

  console.log(
    `[verifactu] Activated for tenant=${tenant.id} nif=${tenant.nif} nifRegistered=${nifRegistered}`,
  )
}

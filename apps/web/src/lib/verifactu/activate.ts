import { prisma } from '@nexo/prisma'
import { createProvider } from '@nexo/verifactu'
import { VerifactiProvider } from '@nexo/verifactu'

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
    }
  } else {
    console.warn('[verifactu] VERIFACTU_API_KEY not set — skipping NIF registration')
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      verifactuProvider: 'verifacti',
      verifactuNifRegistered: nifRegistered,
    },
  })

  console.log(
    `[verifactu] Activated for tenant=${tenant.id} nif=${tenant.nif} nifRegistered=${nifRegistered}`,
  )
}

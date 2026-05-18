import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SUPERCLIM_NIF = 'B13456850'
const TRIAL_GRACE_DAYS = 30

async function main() {
  const tenants = await prisma.tenant.findMany({
    where: { trialEndsAt: null },
    select: { id: true, name: true, nif: true, subscriptionStatus: true },
  })

  console.log(`Found ${tenants.length} tenants without trialEndsAt\n`)

  for (const tenant of tenants) {
    if (tenant.subscriptionStatus === 'ACTIVE' || tenant.nif === SUPERCLIM_NIF) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { subscriptionStatus: 'ACTIVE' },
      })
      console.log(`✅ ${tenant.name} (${tenant.nif}) → ACTIVE (no trial needed)`)
      continue
    }

    const trialEndsAt = new Date(Date.now() + TRIAL_GRACE_DAYS * 24 * 60 * 60 * 1000)
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        trialEndsAt,
        subscriptionStatus: tenant.subscriptionStatus ?? 'TRIAL',
      },
    })
    console.log(
      `⏱  ${tenant.name} (${tenant.nif}) → trial until ${trialEndsAt.toLocaleDateString('es-ES')}`,
    )
  }

  console.log('\n✅ Migration complete')
}

main()
  .catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : String(e))
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

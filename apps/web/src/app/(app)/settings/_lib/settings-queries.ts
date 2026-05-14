import { prisma } from '@nexo/prisma'

export async function getTenantSettings(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { branding: true },
  })
}

export async function listTenantSeries(tenantId: string) {
  return prisma.invoiceSeries.findMany({
    where: { tenantId },
    orderBy: [{ isActive: 'desc' }, { code: 'asc' }],
  })
}

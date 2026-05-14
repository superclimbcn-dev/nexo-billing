import { prisma } from '@nexo/prisma'

export async function previewNextInvoiceNumber(tenantId: string, seriesId: string) {
  const series = await prisma.invoiceSeries.findFirst({
    where: { id: seriesId, tenantId },
  })
  if (!series) throw new Error('Serie no encontrada')

  const year = new Date().getFullYear()
  const padded = String(series.nextNumber).padStart(4, '0')

  return {
    number: series.nextNumber,
    formatted: `${series.code}-${year}-${padded}`,
    seriesCode: series.code,
  }
}

export async function listSeriesForTenant(tenantId: string) {
  return prisma.invoiceSeries.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, code: true, name: true, nextNumber: true },
    orderBy: { code: 'asc' },
  })
}

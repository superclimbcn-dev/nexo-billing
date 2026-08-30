import { prisma } from '@nexo/prisma'

interface IncrementedSeriesCounter {
  code: string
  numberFormat: string
  nextNumber: number
}

export interface ReservedInvoiceNumber {
  number: number
  fullNumber: string
  seriesCode: string
}

export function formatInvoiceNumber(
  seriesCode: string,
  numberFormat: string,
  issuedAt: Date,
  number: number,
): string {
  const year = issuedAt.getFullYear()
  const padding = Math.max(1, numberFormat.length)
  return `${seriesCode}-${year}-${String(number).padStart(padding, '0')}`
}

export async function reserveInvoiceNumber(
  incrementCounter: () => Promise<IncrementedSeriesCounter>,
  issuedAt: Date,
): Promise<ReservedInvoiceNumber> {
  const incremented = await incrementCounter()
  const number = incremented.nextNumber - 1

  return {
    number,
    fullNumber: formatInvoiceNumber(
      incremented.code,
      incremented.numberFormat,
      issuedAt,
      number,
    ),
    seriesCode: incremented.code,
  }
}

export async function previewNextInvoiceNumber(tenantId: string, seriesId: string) {
  const series = await prisma.invoiceSeries.findFirst({
    where: { id: seriesId, tenantId },
  })
  if (!series) throw new Error('Serie no encontrada')

  return {
    number: series.nextNumber,
    formatted: formatInvoiceNumber(
      series.code,
      series.numberFormat,
      new Date(),
      series.nextNumber,
    ),
    seriesCode: series.code,
  }
}

export async function listSeriesForTenant(tenantId: string) {
  return prisma.invoiceSeries.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, code: true, name: true, numberFormat: true, nextNumber: true },
    orderBy: { code: 'asc' },
  })
}

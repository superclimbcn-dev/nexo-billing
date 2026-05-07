import { prisma, RecurringStatus } from '@nexo/prisma'
import { FREQUENCY_OPTIONS } from './recurring-schema'

export function frequencyLabel(value: string): string {
  return FREQUENCY_OPTIONS.find((o) => o.value === value)?.label ?? value
}

export interface ListContractsParams {
  tenantId: string
  status?: string
}

export async function listContracts({ tenantId, status }: ListContractsParams) {
  const validStatus =
    status && Object.values(RecurringStatus).includes(status as RecurringStatus)
      ? (status as RecurringStatus)
      : undefined

  return prisma.recurringContract.findMany({
    where: {
      tenantId,
      ...(validStatus ? { status: validStatus } : {}),
    },
    include: {
      client: { select: { id: true, name: true, nif: true } },
    },
    orderBy: { nextBillingAt: 'asc' },
  })
}

export async function getContractById(tenantId: string, id: string) {
  return prisma.recurringContract.findFirst({
    where: { id, tenantId },
    include: {
      client: { select: { id: true, name: true, nif: true, legalName: true } },
      lines: { orderBy: { position: 'asc' } },
      invoices: {
        select: {
          id: true,
          fullNumber: true,
          issuedAt: true,
          totalAmount: true,
          status: true,
        },
        orderBy: { issuedAt: 'desc' },
        take: 20,
      },
    },
  })
}

export async function countActiveContracts(tenantId: string): Promise<number> {
  return prisma.recurringContract.count({
    where: { tenantId, status: RecurringStatus.ACTIVE },
  })
}

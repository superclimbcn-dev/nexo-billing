import { prisma, RecurringFrequency, RecurringStatus } from '@nexo/prisma'

function addFrequency(date: Date, frequency: RecurringFrequency): Date {
  const d = new Date(date)
  switch (frequency) {
    case RecurringFrequency.WEEKLY:
      d.setDate(d.getDate() + 7)
      break
    case RecurringFrequency.BIWEEKLY:
      d.setDate(d.getDate() + 14)
      break
    case RecurringFrequency.MONTHLY:
      d.setMonth(d.getMonth() + 1)
      break
    case RecurringFrequency.BIMONTHLY:
      d.setMonth(d.getMonth() + 2)
      break
    case RecurringFrequency.QUARTERLY:
      d.setMonth(d.getMonth() + 3)
      break
    case RecurringFrequency.SEMIANNUAL:
      d.setMonth(d.getMonth() + 6)
      break
    case RecurringFrequency.ANNUAL:
      d.setFullYear(d.getFullYear() + 1)
      break
  }
  return d
}

function roundCents(v: number): number {
  return Math.round(v * 100) / 100
}

export async function emitDueInvoices(
  tenantId: string,
  contractId?: string,
): Promise<{ emitted: number; invoiceIds: string[] }> {
  const now = new Date()

  const contracts = await prisma.recurringContract.findMany({
    where: {
      tenantId,
      status: RecurringStatus.ACTIVE,
      nextBillingAt: { lte: now },
      ...(contractId ? { id: contractId } : {}),
    },
    include: {
      lines: { orderBy: { position: 'asc' } },
      client: { select: { id: true } },
    },
  })

  const invoiceIds: string[] = []

  for (const contract of contracts) {
    try {
      const invoiceId = await prisma.$transaction(async (tx) => {
        const series = await tx.invoiceSeries.findFirst({
          where: { tenantId, code: contract.seriesCode, isActive: true },
        })
        if (!series) throw new Error(`Serie "${contract.seriesCode}" no encontrada para tenant ${tenantId}`)

        const today = new Date()
        const dueAt = new Date(today)
        dueAt.setDate(dueAt.getDate() + 30)

        const number = series.nextNumber
        const year = today.getFullYear()
        const fullNumber = `${series.code}-${year}-${String(number).padStart(4, '0')}`

        let subtotal = 0
        let vatAmount = 0

        const linesData = contract.lines.map((line) => {
          const qty = Number(line.quantity)
          const price = Number(line.unitPrice)
          const rate = Number(line.taxRate)
          const lineSub = roundCents(qty * price)
          const lineVat = roundCents(lineSub * (rate / 100))
          subtotal += lineSub
          vatAmount += lineVat
          return {
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            vatRate: line.taxRate,
            subtotal: lineSub,
            vatAmount: lineVat,
            totalAmount: roundCents(lineSub + lineVat),
            sortOrder: line.position,
          }
        })

        subtotal = roundCents(subtotal)
        vatAmount = roundCents(vatAmount)
        const total = roundCents(subtotal + vatAmount)

        const invoice = await tx.invoice.create({
          data: {
            tenantId,
            clientId: contract.clientId,
            seriesId: series.id,
            recurringContractId: contract.id,
            number,
            fullNumber,
            issuedAt: today,
            dueAt,
            status: 'draft',
            subtotal,
            vatAmount,
            totalAmount: total,
            notes: contract.notes ?? null,
          },
          select: { id: true },
        })

        await tx.invoiceLine.createMany({
          data: linesData.map((l) => ({ invoiceId: invoice.id, ...l })),
        })

        await tx.invoiceSeries.update({
          where: { id: series.id },
          data: { nextNumber: { increment: 1 } },
        })

        const nextBillingAt = addFrequency(contract.nextBillingAt, contract.frequency)
        const isFinished = contract.endDate != null && nextBillingAt > contract.endDate

        await tx.recurringContract.update({
          where: { id: contract.id },
          data: {
            nextBillingAt,
            status: isFinished ? RecurringStatus.FINISHED : RecurringStatus.ACTIVE,
          },
        })

        return invoice.id
      })

      invoiceIds.push(invoiceId)
    } catch {
      // Continue with next contract on failure
    }
  }

  return { emitted: invoiceIds.length, invoiceIds }
}

import { Prisma } from '@nexo/prisma'

export interface SimplifiedInvoiceAmounts {
  subtotal: Prisma.Decimal
  vatAmount: Prisma.Decimal
  totalAmount: Prisma.Decimal
}

export function calculateSimplifiedInvoiceAmounts(
  totalVatIncluded: number | string | Prisma.Decimal,
  vatRate: number | string | Prisma.Decimal,
): SimplifiedInvoiceAmounts {
  const totalAmount = new Prisma.Decimal(totalVatIncluded).toDecimalPlaces(
    2,
    Prisma.Decimal.ROUND_HALF_UP,
  )
  const rate = new Prisma.Decimal(vatRate)
  const divisor = new Prisma.Decimal(1).plus(rate.dividedBy(100))
  const subtotal = totalAmount.dividedBy(divisor).toDecimalPlaces(
    2,
    Prisma.Decimal.ROUND_HALF_UP,
  )
  const vatAmount = totalAmount.minus(subtotal).toDecimalPlaces(
    2,
    Prisma.Decimal.ROUND_HALF_UP,
  )

  return { subtotal, vatAmount, totalAmount }
}

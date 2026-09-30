'use server'

import { prisma } from '@nexo/prisma'
import { signInvoiceToken } from '@/lib/public-invoice-token'
import { requireOwnerOrAdminAction } from '@/lib/auth/role-guard'

export async function signInvoiceTokenAction(invoiceId: string): Promise<{ token: string }> {
  const auth = await requireOwnerOrAdminAction()
  if (!auth) throw new Error('Forbidden')
  const { tenantId } = auth

  const inv = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId },
    select: { id: true },
  })
  if (!inv) throw new Error('Invoice not found')

  const token = signInvoiceToken({ invoiceId, tenantId })
  return { token }
}

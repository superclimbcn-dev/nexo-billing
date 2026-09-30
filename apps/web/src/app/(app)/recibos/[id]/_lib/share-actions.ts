'use server'

import { prisma } from '@nexo/prisma'
import { signReceiptToken } from '@/lib/public-receipt-token'
import { requireOwnerOrAdminAction } from '@/lib/auth/role-guard'

export async function signReceiptTokenAction(receiptId: string): Promise<{ token: string }> {
  const auth = await requireOwnerOrAdminAction()
  if (!auth) throw new Error('Forbidden')
  const { tenantId } = auth

  const receipt = await prisma.receipt.findFirst({
    where: { id: receiptId, tenantId },
    select: { id: true },
  })
  if (!receipt) throw new Error('Receipt not found')

  const token = signReceiptToken({ receiptId, tenantId })
  return { token }
}

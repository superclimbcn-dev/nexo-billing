'use server'

import { createServerClient } from '@nexo/core-auth'
import { prisma } from '@nexo/prisma'
import { signReceiptToken } from '@/lib/public-receipt-token'

export async function signReceiptTokenAction(receiptId: string): Promise<{ token: string }> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) throw new Error('No tenant')

  const receipt = await prisma.receipt.findFirst({
    where: { id: receiptId, tenantId },
    select: { id: true },
  })
  if (!receipt) throw new Error('Receipt not found')

  const token = signReceiptToken({ receiptId, tenantId })
  return { token }
}

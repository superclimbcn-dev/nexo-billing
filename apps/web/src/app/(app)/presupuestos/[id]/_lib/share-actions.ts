'use server'

import { prisma } from '@nexo/prisma'
import { signQuoteToken } from '@/lib/public-quote-token'
import { requireOwnerOrAdminAction } from '@/lib/auth/role-guard'

export async function signQuoteTokenAction(quoteId: string): Promise<{ token: string }> {
  const auth = await requireOwnerOrAdminAction()
  if (!auth) throw new Error('Forbidden')
  const { tenantId } = auth

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, tenantId },
    select: { id: true },
  })
  if (!quote) throw new Error('Quote not found')

  const token = signQuoteToken({ quoteId, tenantId })
  return { token }
}

'use server'

import { createServerClient } from '@nexo/core-auth'
import { prisma } from '@nexo/prisma'
import { signQuoteToken } from '@/lib/public-quote-token'

export async function signQuoteTokenAction(quoteId: string): Promise<{ token: string }> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) throw new Error('No tenant')

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, tenantId },
    select: { id: true },
  })
  if (!quote) throw new Error('Quote not found')

  const token = signQuoteToken({ quoteId, tenantId })
  return { token }
}

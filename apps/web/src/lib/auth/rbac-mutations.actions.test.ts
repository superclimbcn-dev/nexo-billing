import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const mocks = vi.hoisted(() => ({
  requireOwnerOrAdminAction: vi.fn(),
}))

vi.mock('@/lib/auth/role-guard', () => ({
  requireOwnerOrAdminAction: mocks.requireOwnerOrAdminAction,
}))

import { createInvoiceDraft } from '@/app/(app)/facturas/_lib/invoice-actions'
import {
  cancelContract,
  createContract,
  emitNow,
  pauseContract,
  resumeContract,
  updateContract,
} from '@/app/(app)/recurrentes/_lib/recurring-actions'
import {
  convertQuoteToInvoice,
  createQuoteDraft,
  deleteQuoteDraft,
  updateQuoteStatus,
} from '@/app/(app)/presupuestos/_lib/quote-actions'
import {
  createReceiptDraft,
  deleteReceiptDraft,
  updateReceiptStatus,
} from '@/app/(app)/recibos/_lib/receipt-actions'
import { submitToVerifactu, cancelVerifactuInvoice } from '@/app/(app)/facturas/[id]/_lib/verifactu-actions'
import { createItemQuick, createClientQuick } from '@/app/(app)/facturas/_lib/item-search-action'
import { signInvoiceTokenAction } from '@/app/(app)/facturas/[id]/_lib/share-actions'
import { signQuoteTokenAction } from '@/app/(app)/presupuestos/[id]/_lib/share-actions'
import { signReceiptTokenAction } from '@/app/(app)/recibos/[id]/_lib/share-actions'
import { updateTheme } from '@/app/(app)/settings/_actions/update-theme'
import { POST as emitRecurring } from '@/app/api/recurring/emit/route'
import { POST as importCsv } from '@/app/api/import/csv/route'

const denied = { ok: false, error: 'No tienes permiso para realizar esta acción' }

describe.each(['ACCOUNTANT', 'MEMBER', 'VIEWER'])('%s direct mutation attempts', () => {
  beforeEach(() => {
    mocks.requireOwnerOrAdminAction.mockReset()
    mocks.requireOwnerOrAdminAction.mockResolvedValue(null)
  })

  it('denies invoice creation', async () => {
    await expect(createInvoiceDraft({})).resolves.toEqual(denied)
  })

  it('denies every recurring mutation', async () => {
    await expect(createContract({})).resolves.toEqual(denied)
    await expect(updateContract('id', {})).resolves.toEqual(denied)
    await expect(pauseContract('id')).resolves.toEqual(denied)
    await expect(resumeContract('id')).resolves.toEqual(denied)
    await expect(cancelContract('id')).resolves.toEqual(denied)
    await expect(emitNow('id')).resolves.toEqual(denied)
  })

  it('denies every quote mutation', async () => {
    await expect(createQuoteDraft({})).resolves.toEqual(denied)
    await expect(updateQuoteStatus('id', 'sent')).resolves.toEqual(denied)
    await expect(deleteQuoteDraft('id')).resolves.toEqual(denied)
    await expect(convertQuoteToInvoice('id')).resolves.toEqual(denied)
  })

  it('denies every receipt mutation', async () => {
    await expect(createReceiptDraft({})).resolves.toEqual(denied)
    await expect(updateReceiptStatus('id', 'issued')).resolves.toEqual(denied)
    await expect(deleteReceiptDraft('id')).resolves.toEqual(denied)
  })

  it('denies Verifactu before processing', async () => {
    await expect(submitToVerifactu('id')).resolves.toEqual(denied)
    await expect(cancelVerifactuInvoice('id')).resolves.toEqual(denied)
  })

  it('denies quick creation and administrative theme changes', async () => {
    await expect(createItemQuick({ name: 'x', unitPrice: 1, vatRate: 21 })).resolves.toEqual(denied)
    await expect(createClientQuick({ name: 'x' })).resolves.toEqual(denied)
    await expect(updateTheme('dark')).resolves.toEqual(denied)
  })

  it('denies share-token generation', async () => {
    await expect(signInvoiceTokenAction('id')).rejects.toThrow('Forbidden')
    await expect(signQuoteTokenAction('id')).rejects.toThrow('Forbidden')
    await expect(signReceiptTokenAction('id')).rejects.toThrow('Forbidden')
  })

  it('denies mutable HTTP handlers', async () => {
    const emitResponse = await emitRecurring()
    expect(emitResponse.status).toBe(403)
    const csvResponse = await importCsv(new Request('https://example.test/api/import/csv', { method: 'POST' }) as never)
    expect(csvResponse.status).toBe(403)
  })
})

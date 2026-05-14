import { describe, it, expect, beforeEach } from 'vitest'
import { ChainService, type IRecordRepository } from './chain-service'
import { computeRecordHash } from '../crypto/hash'
import { VerifactuChainBrokenError } from '../errors'
import type { InvoiceRecordData } from '../providers/types'

class InMemoryRecordRepository implements IRecordRepository {
  private records: InvoiceRecordData[] = []

  async findLastByTenant(tenantId: string): Promise<InvoiceRecordData | null> {
    const filtered = this.records.filter((r) => r.tenantId === tenantId)
    return filtered.length > 0 ? filtered[filtered.length - 1]! : null
  }

  async create(record: InvoiceRecordData): Promise<InvoiceRecordData> {
    this.records.push(record)
    return record
  }

  async findByTenant(tenantId: string): Promise<InvoiceRecordData[]> {
    return this.records.filter((r) => r.tenantId === tenantId)
  }

  // Test helper to tamper with a stored hash
  tamperHash(recordId: string, fakeHash: string): void {
    const rec = this.records.find((r) => r.id === recordId)
    if (rec) rec.hash = fakeHash
  }
}

function makeRecord(overrides: Partial<InvoiceRecordData> = {}): InvoiceRecordData {
  return {
    id: `rec-${Math.random().toString(36).slice(2, 8)}`,
    tenantId: 'tenant-1',
    invoiceId: 'inv-001',
    type: 'Alta',
    hash: '',
    previousHash: null,
    canonicalXml: '<xml/>',
    qrUrl: null,
    sentAt: null,
    aeatResponse: null,
    status: 'pending',
    createdAt: new Date('2024-11-29T10:00:00.000Z'),
    ...overrides,
  }
}

describe('ChainService', () => {
  let repo: InMemoryRecordRepository
  let service: ChainService

  beforeEach(() => {
    repo = new InMemoryRecordRepository()
    service = new ChainService(repo)
  })

  it('returns null when no records exist for a tenant', async () => {
    const last = await service.getLastRecord('tenant-1')
    expect(last).toBeNull()
  })

  it('appends the first record with previousHash=null', async () => {
    const record = makeRecord()
    const result = await service.appendRecord(record)

    expect(result.previousHash).toBeNull()
    expect(result.hash).toHaveLength(64)
    expect(result.hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('links the second record to the first one', async () => {
    const r1 = await service.appendRecord(makeRecord({ id: 'rec-1' }))
    const r2 = await service.appendRecord(makeRecord({ id: 'rec-2' }))

    expect(r2.previousHash).toBe(r1.hash)
    expect(r2.hash).not.toBe(r1.hash)
  })

  it('validates a correct chain', async () => {
    await service.appendRecord(makeRecord({ id: 'rec-1' }))
    await service.appendRecord(makeRecord({ id: 'rec-2' }))
    await service.appendRecord(makeRecord({ id: 'rec-3' }))

    const valid = await service.validateChain('tenant-1')
    expect(valid).toBe(true)
  })

  it('validates an empty chain as true', async () => {
    const valid = await service.validateChain('tenant-1')
    expect(valid).toBe(true)
  })

  it('throws VerifactuChainBrokenError when a hash is tampered', async () => {
    await service.appendRecord(makeRecord({ id: 'rec-1' }))
    await service.appendRecord(makeRecord({ id: 'rec-2' }))

    repo.tamperHash('rec-2', '0000000000000000000000000000000000000000000000000000000000000000')

    await expect(service.validateChain('tenant-1')).rejects.toThrow(
      VerifactuChainBrokenError,
    )
  })

  it('isolates tenants (records in one tenant do not affect another)', async () => {
    const r1 = await service.appendRecord(makeRecord({ id: 'rec-1', tenantId: 'tenant-a' }))
    const r2 = await service.appendRecord(makeRecord({ id: 'rec-2', tenantId: 'tenant-b' }))

    expect(r1.previousHash).toBeNull()
    expect(r2.previousHash).toBeNull()

    const validA = await service.validateChain('tenant-a')
    const validB = await service.validateChain('tenant-b')
    expect(validA).toBe(true)
    expect(validB).toBe(true)
  })

  it('recomputes hash deterministically during validation', async () => {
    const record = makeRecord({ id: 'rec-1' })
    const appended = await service.appendRecord(record)

    const dataOnly = { ...record }
    delete (dataOnly as Record<string, unknown>).hash
    delete (dataOnly as Record<string, unknown>).previousHash

    const expectedHash = computeRecordHash(dataOnly, null)
    expect(appended.hash).toBe(expectedHash)
  })
})

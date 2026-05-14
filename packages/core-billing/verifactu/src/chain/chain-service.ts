import { computeRecordHash } from '../crypto/hash'
import { VerifactuChainBrokenError } from '../errors'
import type { InvoiceRecordData } from '../providers/types'

export interface IRecordRepository {
  findLastByTenant(tenantId: string): Promise<InvoiceRecordData | null>
  create(record: InvoiceRecordData): Promise<InvoiceRecordData>
  findByTenant(tenantId: string): Promise<InvoiceRecordData[]>
}

function extractHashableFields(
  record: InvoiceRecordData,
): Record<string, unknown> {
  const { hash: _hash, previousHash: _prev, ...rest } = record
  void _hash
  void _prev
  return rest
}

export class ChainService {
  constructor(private readonly repo: IRecordRepository) {}

  async getLastRecord(tenantId: string): Promise<InvoiceRecordData | null> {
    return this.repo.findLastByTenant(tenantId)
  }

  async appendRecord(record: InvoiceRecordData): Promise<InvoiceRecordData> {
    const last = await this.getLastRecord(record.tenantId)
    const previousHash = last?.hash ?? null

    const dataOnly = extractHashableFields(record)
    const hash = computeRecordHash(dataOnly, previousHash)

    const recordWithHash: InvoiceRecordData = { ...record, hash, previousHash }
    return this.repo.create(recordWithHash)
  }

  async validateChain(tenantId: string): Promise<boolean> {
    const records = await this.repo.findByTenant(tenantId)
    if (records.length === 0) {
      return true
    }

    for (let i = 0; i < records.length; i++) {
      const current = records[i]
      if (!current) continue
      const previousHash = i > 0 ? records[i - 1]!.hash : null
      const dataOnly = extractHashableFields(current)
      const expectedHash = computeRecordHash(dataOnly, previousHash)

      if (current.hash !== expectedHash) {
        throw new VerifactuChainBrokenError(
          'Cadena de registros verifactu rota',
          tenantId,
          expectedHash,
          current.hash,
        )
      }
    }

    return true
  }
}

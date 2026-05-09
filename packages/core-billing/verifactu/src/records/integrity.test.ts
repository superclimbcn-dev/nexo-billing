import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('InvoiceRecord database immutability triggers', () => {
  const migrationPath = resolve(
    __dirname,
    '../../../../../infrastructure/prisma/migrations/20240509_add_verifactu_immutability_triggers/migration.sql',
  )

  let sql: string

  it('migration file exists', () => {
    sql = readFileSync(migrationPath, 'utf-8')
    expect(sql).toBeDefined()
    expect(sql.length).toBeGreaterThan(0)
  })

  it('contains BEFORE UPDATE trigger for sent records', () => {
    sql = readFileSync(migrationPath, 'utf-8')
    expect(sql).toMatch(/BEFORE UPDATE ON invoice_records/i)
    expect(sql).toMatch(/OLD\.sent_at IS NOT NULL/i)
    expect(sql).toMatch(/Factura enviada a AEAT nao pode ser modificada/i)
  })

  it('contains BEFORE DELETE trigger for all records', () => {
    sql = readFileSync(migrationPath, 'utf-8')
    expect(sql).toMatch(/BEFORE DELETE ON invoice_records/i)
    expect(sql).toMatch(/Facturas nao podem ser apagadas\. Use anulacao\./i)
  })

  it('contains BEFORE INSERT trigger to enforce hash presence', () => {
    sql = readFileSync(migrationPath, 'utf-8')
    expect(sql).toMatch(/BEFORE INSERT ON invoice_records/i)
    expect(sql).toMatch(/NEW\.hash IS NULL OR NEW\.hash = ''/i)
    expect(sql).toMatch(/Hash do registo Verifactu e obrigatorio antes do insert/i)
  })

  it('defines all trigger functions with CREATE OR REPLACE FUNCTION', () => {
    sql = readFileSync(migrationPath, 'utf-8')
    const functions = [
      'prevent_invoice_record_update',
      'prevent_invoice_record_delete',
      'validate_invoice_record_insert',
    ]
    for (const fn of functions) {
      expect(sql).toMatch(new RegExp(`CREATE OR REPLACE FUNCTION ${fn}\\(\\)`, 'i'))
    }
  })

  it('creates all three triggers on invoice_records table', () => {
    sql = readFileSync(migrationPath, 'utf-8')
    const triggers = [
      'invoice_record_prevent_update',
      'invoice_record_prevent_delete',
      'invoice_record_validate_insert',
    ]
    for (const trigger of triggers) {
      expect(sql).toMatch(new RegExp(`CREATE TRIGGER ${trigger}`, 'i'))
      expect(sql).toMatch(new RegExp(`DROP TRIGGER IF EXISTS ${trigger} ON invoice_records`, 'i'))
    }
  })
})

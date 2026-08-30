import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Invoice fiscal immutability migration', () => {
  const migrationPath = resolve(
    __dirname,
    '../../../../../infrastructure/prisma/prisma/migrations/20260830120000_add_simplified_invoices/migration.sql',
  );
  const sql = readFileSync(migrationPath, 'utf8');

  it('keeps drafts editable and applies protection only after emission', () => {
    expect(sql).toMatch(/IF OLD\.status != 'draft' THEN/i);
  });

  it.each([
    'series_id',
    'number',
    'issued_at',
    'operation_at',
    'client_id',
    'tenant_id',
    'type',
    'subtotal',
    'vat_amount',
    'total_amount',
    'payment_method',
  ])('protects %s with a NULL-safe comparison', (column) => {
    expect(sql).toMatch(new RegExp(`NEW\\.${column}\\s+IS DISTINCT FROM OLD\\.${column}`, 'i'));
  });

  it('protects only the fiscal consumerHomeService path in sector metadata', () => {
    expect(sql).toMatch(
      /NEW\.sector_metadata\s*#>\s*'\{simplifiedInvoice,consumerHomeService\}'[\s\S]*IS DISTINCT FROM[\s\S]*OLD\.sector_metadata\s*#>\s*'\{simplifiedInvoice,consumerHomeService\}'/i,
    );
    expect(sql).not.toMatch(/NEW\.sector_metadata\s+IS DISTINCT FROM OLD\.sector_metadata/i);
  });

  describe('invoice line trigger', () => {
    it('covers INSERT, UPDATE and DELETE before the operation', () => {
      expect(sql).toMatch(/BEFORE INSERT OR UPDATE OR DELETE ON invoice_lines/i);
      expect(sql).toMatch(/TG_OP = 'INSERT' THEN NEW\.invoice_id ELSE OLD\.invoice_id/i);
    });

    it('allows draft lines and blocks issued invoice lines', () => {
      expect(sql).toMatch(/source_invoice_status != 'draft'/i);
      expect(sql).toMatch(/Cannot modify fiscal lines of issued invoice/i);
    });

    it('rejects missing invoices instead of allowing a bypass', () => {
      expect(sql).toMatch(/IF NOT FOUND THEN[\s\S]*invoice % does not exist/i);
    });

    it('checks the target invoice when invoice_id changes', () => {
      expect(sql).toMatch(/TG_OP = 'UPDATE' AND NEW\.invoice_id IS DISTINCT FROM OLD\.invoice_id/i);
      expect(sql).toMatch(/target_invoice_status != 'draft'/i);
    });

    it('does not alter or disable tenant RLS policies', () => {
      expect(sql).not.toMatch(/ALTER TABLE invoice_lines DISABLE ROW LEVEL SECURITY/i);
      expect(sql).not.toMatch(/DROP POLICY/i);
      expect(sql).not.toMatch(/SECURITY DEFINER/i);
    });
  });

  it('creates the F2 atomically in draft-line-payment-paid order', () => {
    const actionPath = resolve(
      __dirname,
      '../../../../../apps/web/src/app/(app)/facturas/_lib/invoice-actions.ts',
    );
    const action = readFileSync(actionPath, 'utf8');
    const f2Start = action.indexOf('export async function createSimplifiedInvoice');
    const transaction = action.slice(
      f2Start,
      action.indexOf("revalidatePath('/facturas')", f2Start),
    );

    expect(transaction).toMatch(/prisma\.\$transaction/);
    const draft = transaction.indexOf("status: 'draft'");
    const line = transaction.indexOf('tx.invoiceLine.create');
    const payment = transaction.indexOf('tx.payment.create');
    const paid = transaction.lastIndexOf("data: { status: 'paid' }");

    expect(draft).toBeGreaterThan(-1);
    expect(line).toBeGreaterThan(draft);
    expect(payment).toBeGreaterThan(line);
    expect(paid).toBeGreaterThan(payment);
  });
});

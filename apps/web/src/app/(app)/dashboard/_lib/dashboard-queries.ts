import { Prisma, prisma } from '@nexo/prisma';
import type { SubscriptionTenant } from '@/lib/subscription';

export interface DashboardStats {
  invoicedThisMonth: { amount: number; count: number };
  invoicedLastMonth: { amount: number; count: number };
  collectedThisMonth: { amount: number; count: number };
  pendingCollection: { amount: number; count: number };
  overdue: { amount: number; count: number };
  vatThisQuarter: { amount: number };
  activeClients: number;
  catalogItems: number;
  recentInvoices: Array<{
    id: string;
    fullNumber: string;
    issuedAt: Date;
    status: string;
    totalAmount: number;
    clientName: string;
  }>;
}

export interface DashboardPageData {
  stats: DashboardStats;
  tenant: SubscriptionTenant | null;
  activeContracts: number;
}

interface DashboardQueryRow {
  plan: unknown;
  subscription_status: unknown;
  subscription_expires_at: unknown;
  trial_ends_at: unknown;
  invoiced_this_month_amount: unknown;
  invoiced_this_month_count: unknown;
  invoiced_last_month_amount: unknown;
  invoiced_last_month_count: unknown;
  collected_this_month_amount: unknown;
  collected_this_month_count: unknown;
  pending_collection_amount: unknown;
  pending_collection_count: unknown;
  overdue_amount: unknown;
  overdue_count: unknown;
  vat_this_quarter_amount: unknown;
  active_clients: unknown;
  catalog_items: unknown;
  active_contracts: unknown;
  recent_invoices: unknown;
}

function monthStart(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') return Number(value);
  if (value instanceof Prisma.Decimal) return value.toNumber();
  if (value && typeof value === 'object' && 'toString' in value) {
    const parsed = Number(String(value));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toDateOrNull(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function parseRecentInvoices(value: unknown): DashboardStats['recentInvoices'] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const id = toStringOrNull(record.id);
      const fullNumber = toStringOrNull(record.fullNumber);
      const issuedAt = toDateOrNull(record.issuedAt);
      const status = toStringOrNull(record.status);
      const clientName = toStringOrNull(record.clientName);
      if (!id || !fullNumber || !issuedAt || !status || !clientName) return null;

      return {
        id,
        fullNumber,
        issuedAt,
        status,
        totalAmount: toNumber(record.totalAmount),
        clientName,
      };
    })
    .filter((invoice): invoice is DashboardStats['recentInvoices'][number] => invoice !== null);
}

export async function getDashboardPageData(tenantId: string): Promise<DashboardPageData> {
  const now = new Date();
  const thisMonthStart = monthStart(now.getFullYear(), now.getMonth());
  const lastMonthStart = monthStart(now.getFullYear(), now.getMonth() - 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  const quarterStart = monthStart(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3);

  const rows = await prisma.$queryRaw<DashboardQueryRow[]>`
    WITH invoice_stats AS (
      SELECT
        COALESCE(SUM(total_amount) FILTER (
          WHERE issued_at >= ${thisMonthStart}
            AND status NOT IN ('draft', 'cancelled')
        ), 0) AS invoiced_this_month_amount,
        COUNT(*) FILTER (
          WHERE issued_at >= ${thisMonthStart}
            AND status NOT IN ('draft', 'cancelled')
        ) AS invoiced_this_month_count,
        COALESCE(SUM(total_amount) FILTER (
          WHERE issued_at >= ${lastMonthStart}
            AND issued_at <= ${lastMonthEnd}
            AND status NOT IN ('draft', 'cancelled')
        ), 0) AS invoiced_last_month_amount,
        COUNT(*) FILTER (
          WHERE issued_at >= ${lastMonthStart}
            AND issued_at <= ${lastMonthEnd}
            AND status NOT IN ('draft', 'cancelled')
        ) AS invoiced_last_month_count,
        COALESCE(SUM(paid_amount) FILTER (
          WHERE issued_at >= ${thisMonthStart}
            AND status = 'paid'
        ), 0) AS collected_this_month_amount,
        COUNT(*) FILTER (
          WHERE issued_at >= ${thisMonthStart}
            AND status = 'paid'
        ) AS collected_this_month_count,
        COALESCE(SUM(total_amount) FILTER (
          WHERE status IN ('sent', 'overdue', 'partially_paid')
        ), 0) AS pending_collection_amount,
        COUNT(*) FILTER (
          WHERE status IN ('sent', 'overdue', 'partially_paid')
        ) AS pending_collection_count,
        COALESCE(SUM(total_amount) FILTER (
          WHERE status = 'overdue'
             OR (status = 'sent' AND due_at < ${now})
        ), 0) AS overdue_amount,
        COUNT(*) FILTER (
          WHERE status = 'overdue'
             OR (status = 'sent' AND due_at < ${now})
        ) AS overdue_count,
        COALESCE(SUM(vat_amount) FILTER (
          WHERE issued_at >= ${quarterStart}
            AND status NOT IN ('draft', 'cancelled')
        ), 0) AS vat_this_quarter_amount
      FROM invoices
      WHERE tenant_id = ${tenantId}::uuid
    ),
    client_stats AS (
      SELECT COUNT(*) AS active_clients
      FROM clients
      WHERE tenant_id = ${tenantId}::uuid
        AND is_active = true
    ),
    item_stats AS (
      SELECT COUNT(*) AS catalog_items
      FROM items
      WHERE tenant_id = ${tenantId}::uuid
        AND is_active = true
    ),
    recurring_stats AS (
      SELECT COUNT(*) AS active_contracts
      FROM recurring_contracts
      WHERE tenant_id = ${tenantId}::uuid
        AND status = 'ACTIVE'
    ),
    recent_invoice_rows AS (
      SELECT
        inv.id,
        inv.full_number,
        inv.issued_at,
        inv.status,
        inv.total_amount,
        clients.name AS client_name
      FROM invoices inv
      INNER JOIN clients ON clients.id = inv.client_id
      WHERE inv.tenant_id = ${tenantId}::uuid
      ORDER BY inv.issued_at DESC
      LIMIT 5
    ),
    recent_invoices AS (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', id::text,
            'fullNumber', full_number,
            'issuedAt', issued_at,
            'status', status,
            'totalAmount', total_amount,
            'clientName', client_name
          )
          ORDER BY issued_at DESC
        ),
        '[]'::jsonb
      ) AS recent_invoices
      FROM recent_invoice_rows
    )
    SELECT
      tenants.plan,
      tenants.subscription_status,
      tenants.subscription_expires_at,
      tenants.trial_ends_at,
      invoice_stats.invoiced_this_month_amount,
      invoice_stats.invoiced_this_month_count,
      invoice_stats.invoiced_last_month_amount,
      invoice_stats.invoiced_last_month_count,
      invoice_stats.collected_this_month_amount,
      invoice_stats.collected_this_month_count,
      invoice_stats.pending_collection_amount,
      invoice_stats.pending_collection_count,
      invoice_stats.overdue_amount,
      invoice_stats.overdue_count,
      invoice_stats.vat_this_quarter_amount,
      client_stats.active_clients,
      item_stats.catalog_items,
      recurring_stats.active_contracts,
      recent_invoices.recent_invoices
    FROM tenants
    CROSS JOIN invoice_stats
    CROSS JOIN client_stats
    CROSS JOIN item_stats
    CROSS JOIN recurring_stats
    CROSS JOIN recent_invoices
    WHERE tenants.id = ${tenantId}::uuid
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) {
    return {
      stats: {
        invoicedThisMonth: { amount: 0, count: 0 },
        invoicedLastMonth: { amount: 0, count: 0 },
        collectedThisMonth: { amount: 0, count: 0 },
        pendingCollection: { amount: 0, count: 0 },
        overdue: { amount: 0, count: 0 },
        vatThisQuarter: { amount: 0 },
        activeClients: 0,
        catalogItems: 0,
        recentInvoices: [],
      },
      tenant: null,
      activeContracts: 0,
    };
  }

  return {
    stats: {
      invoicedThisMonth: {
        amount: toNumber(row.invoiced_this_month_amount),
        count: toNumber(row.invoiced_this_month_count),
      },
      invoicedLastMonth: {
        amount: toNumber(row.invoiced_last_month_amount),
        count: toNumber(row.invoiced_last_month_count),
      },
      collectedThisMonth: {
        amount: toNumber(row.collected_this_month_amount),
        count: toNumber(row.collected_this_month_count),
      },
      pendingCollection: {
        amount: toNumber(row.pending_collection_amount),
        count: toNumber(row.pending_collection_count),
      },
      overdue: {
        amount: toNumber(row.overdue_amount),
        count: toNumber(row.overdue_count),
      },
      vatThisQuarter: {
        amount: toNumber(row.vat_this_quarter_amount),
      },
      activeClients: toNumber(row.active_clients),
      catalogItems: toNumber(row.catalog_items),
      recentInvoices: parseRecentInvoices(row.recent_invoices),
    },
    tenant: {
      plan: toStringOrNull(row.plan) ?? 'TRIAL',
      subscriptionStatus: toStringOrNull(row.subscription_status),
      subscriptionExpiresAt: toDateOrNull(row.subscription_expires_at),
      trialEndsAt: toDateOrNull(row.trial_ends_at),
    },
    activeContracts: toNumber(row.active_contracts),
  };
}

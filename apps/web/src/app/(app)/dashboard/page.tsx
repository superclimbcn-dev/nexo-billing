import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@nexo/core-auth';
import { prisma } from '@nexo/prisma';
import { KpiCard, Panel } from '@nexo/core-ui';
import { FilePlus, FileText, TrendingUp, Receipt } from 'lucide-react';
import { CsvImportButton } from './_components/csv-import-button';
import { ExportButton } from '../export/_components/export-button';
import { formatCurrency, formatDate } from '@nexo/core-utils';
import { getDashboardStats } from './_lib/dashboard-queries';
import { RecentInvoices } from './_components/recent-invoices';
import { syncOverdueInvoices } from '../facturas/[id]/_lib/invoice-status-actions';
import { emitDueInvoices } from '@/lib/recurring/emit-due-invoices';
import { countActiveContracts } from '../recurrentes/_lib/recurring-queries';
import { getSubscriptionState, getTrialDaysLeft } from '@/lib/subscription';
import { TrialExpiredModal } from './_components/trial-expired-modal';

function firstName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'equipo';
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

function currencyParts(amount: number): { value: string; unit: string } {
  const formatted = formatCurrency(amount);
  return {
    value: formatted.replace(/\s?€$/, ''),
    unit: '€',
  };
}

function nextVatDeadlineLabel(now: Date): { day: string; detail: string } {
  const year = now.getFullYear();
  const deadlines = [new Date(year, 3, 20), new Date(year, 6, 20), new Date(year, 9, 20)];
  const deadline = deadlines.find((date) => date >= now) ?? new Date(year + 1, 0, 20);
  const daysLeft = Math.max(
    0,
    Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );

  return {
    day: deadline.getDate().toString(),
    detail: `${deadline.toLocaleDateString('es-ES', { month: 'long' })} · en ${daysLeft} días`,
  };
}

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');
  const tenantId = user.app_metadata?.tenant_id as string | undefined;
  const userRole = user.app_metadata?.role as string | undefined;
  if (!tenantId) redirect('/onboarding/cuenta');

  const canWrite = userRole === 'OWNER' || userRole === 'ADMIN';

  // Fire-and-forget background mutations — do NOT block page render
  void Promise.all([emitDueInvoices(tenantId), syncOverdueInvoices(tenantId)]);

  const [stats, tenant] = await Promise.all([
    getDashboardStats(tenantId),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        plan: true,
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
        trialEndsAt: true,
      },
    }),
  ]);
  const activeContracts = await countActiveContracts(tenantId);

  const now = new Date();
  const userLabel =
    (user.user_metadata?.name as string | undefined) ?? user.email?.split('@')[0] ?? '';
  const dateLabel = now.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const vatDeadline = nextVatDeadlineLabel(now);
  const invoiced = currencyParts(stats.invoicedThisMonth.amount);
  const collected = currencyParts(stats.collectedThisMonth.amount);
  const pending = currencyParts(stats.pendingCollection.amount);
  const vat = currencyParts(stats.vatThisQuarter.amount);

  const prevAmount = stats.invoicedLastMonth.amount;
  const invoicedDelta =
    prevAmount > 0
      ? (() => {
          const pct = ((stats.invoicedThisMonth.amount - prevAmount) / prevAmount) * 100;
          return {
            text: `${pct >= 0 ? 'Sube' : 'Baja'} ${Math.abs(pct).toFixed(1)}% vs mes anterior`,
            variant: pct >= 0 ? ('up' as const) : ('down' as const),
          };
        })()
      : {
          text: `${stats.invoicedThisMonth.count} ${
            stats.invoicedThisMonth.count === 1 ? 'factura' : 'facturas'
          } este mes`,
          variant: 'neutral' as const,
        };

  return (
    <div className="flex flex-col gap-8 max-w-[1400px]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="[font-family:var(--font-serif)] text-5xl leading-none text-[var(--text)]">
            Buenos días, <em className="italic text-[var(--text-dim)]">{firstName(userLabel)}</em>
          </h1>
          <p className="text-sm text-[var(--text-dim)] mt-3">Tu facturación en {dateLabel}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {canWrite && (
            <>
              <CsvImportButton />
              <ExportButton />
            </>
          )}
          <Link
            href="/facturas/nueva"
            className="inline-flex items-center justify-center px-5 py-3 rounded-md bg-[var(--accent)] text-[var(--bg)] text-sm font-semibold hover:bg-[var(--accent-dim)] transition-colors"
          >
            + Nueva factura
          </Link>
        </div>
      </div>

      {/* Subscription banners */}
      {canWrite && tenant && (() => {
        const subState = getSubscriptionState(tenant)
        const daysLeft = getTrialDaysLeft(tenant.trialEndsAt)

        if (subState === 'trial_expired' || subState === 'expired') {
          return <TrialExpiredModal />
        }

        if (subState === 'trial_active' && daysLeft < 3) {
          return (
            <div className="p-4 bg-orange-500/10 border border-orange-500/40 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-sm font-medium text-orange-400">
                ⚠️ Tu prueba termina en {daysLeft} {daysLeft === 1 ? 'día' : 'días'} · Activa SEPA para no perder el acceso
              </p>
              <Link
                href="/settings/billing"
                className="shrink-0 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-md hover:bg-orange-600 transition-colors"
              >
                Activar SEPA →
              </Link>
            </div>
          )
        }

        if (subState === 'trial_active') {
          return (
            <div className="p-4 bg-[var(--surface)] border border-[var(--accent)]/20 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-sm text-[var(--text-dim)]">
                Estás en periodo de prueba · <strong className="text-[var(--text)]">{daysLeft} días restantes</strong>
              </p>
              <Link
                href="/settings/billing"
                className="shrink-0 px-4 py-2 border border-[var(--border)] text-[var(--text-dim)] text-sm rounded-md hover:border-[var(--border-strong)] hover:text-[var(--text)] transition-colors"
              >
                Activar SEPA →
              </Link>
            </div>
          )
        }

        if (subState === 'cancelled') {
          return (
            <div className="p-4 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-sm text-[var(--danger)]">
                Tu suscripción fue cancelada · Acceso hasta {tenant.subscriptionExpiresAt ? formatDate(tenant.subscriptionExpiresAt) : '—'}
              </p>
              <Link
                href="/settings/billing"
                className="shrink-0 px-4 py-2 bg-[var(--danger)] text-white text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
              >
                Reactivar →
              </Link>
            </div>
          )
        }

        if (subState === 'active') {
          return (
            <div className="flex items-center gap-2 text-xs text-[var(--text-subtle)]">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--success)]/10 text-[var(--success)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                Profesional
              </span>
              {tenant.subscriptionExpiresAt && (
                <span>Próxima: {formatDate(tenant.subscriptionExpiresAt)}</span>
              )}
              <Link href="/settings/billing" className="text-[var(--accent)] hover:underline ml-1">
                Gestionar
              </Link>
            </div>
          )
        }

        return null
      })()}

      {/* Mobile quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:hidden">
        <MobileQuickAction href="/facturas/nueva" icon={<FilePlus size={24} />} label="Nueva factura" accent />
        <MobileQuickAction href="/facturas" icon={<FileText size={24} />} label="Facturas" />
        <MobileQuickAction href="/tesoreria" icon={<TrendingUp size={24} />} label="Tesorería" />
        <MobileQuickAction href="/gastos" icon={<Receipt size={24} />} label="Nuevo gasto" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Facturado este mes"
          value={invoiced.value}
          unit={invoiced.unit}
          delta={invoicedDelta.text}
          deltaVariant={invoicedDelta.variant}
          featured
          sparkPath="M2 24 L14 20 L26 22 L38 14 L50 17 L62 9 L78 4"
        />
        <KpiCard
          label="Cobrado"
          value={collected.value}
          unit={collected.unit}
          delta={`${stats.collectedThisMonth.count} ${
            stats.collectedThisMonth.count === 1 ? 'factura cobrada' : 'facturas cobradas'
          }`}
          deltaVariant="up"
        />
        <KpiCard
          label="Pendiente"
          value={pending.value}
          unit={pending.unit}
          delta={
            stats.overdue.count > 0
              ? `${stats.overdue.count} vencidas`
              : `${stats.pendingCollection.count} pendientes`
          }
          deltaVariant={stats.overdue.count > 0 ? 'down' : 'neutral'}
        />
        <KpiCard
          label="IVA a liquidar"
          value={vat.value}
          unit={vat.unit}
          delta="Estimación trimestral"
          deltaVariant="neutral"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        <RecentInvoices invoices={stats.recentInvoices} />

        <div className="space-y-4">
          <section className="rounded-lg border border-[var(--border)] bg-gradient-to-br from-[var(--success)] to-teal-600 p-6 text-white overflow-hidden relative">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
            <h2 className="[font-family:var(--font-serif)] text-3xl leading-none">
              Factura por WhatsApp
            </h2>
            <p className="mt-3 text-sm text-white/85">
              Comparte PDFs públicos desde la ficha de factura mientras preparamos la integración
              completa.
            </p>
            <Link
              href="/facturas"
              className="mt-5 inline-flex px-4 py-2 rounded-md bg-white/15 text-sm font-medium hover:bg-white/20 transition-colors"
            >
              Ver facturas
            </Link>
          </section>

          <Panel title="Acciones rápidas">
            <div className="px-5 py-4 border-b border-[var(--border)] space-y-2">
              <QuickAction
                href="/facturas/nueva"
                icon="□"
                title="Crear factura"
                desc="Alta manual con cliente, líneas e IVA"
              />
              <QuickAction
                href="/recurrentes"
                icon="↻"
                title="Emitir recurrentes"
                desc={`${activeContracts} ${
                  activeContracts === 1 ? 'contrato activo' : 'contratos activos'
                }`}
              />
              <QuickAction
                href="/facturas?estado=overdue"
                icon="◎"
                title="Recordar cobros"
                desc={`${stats.overdue.count} ${
                  stats.overdue.count === 1 ? 'factura vencida' : 'facturas vencidas'
                }`}
              />
            </div>

            <div className="px-6 py-5">
              <div className="text-sm font-semibold text-[var(--text)]">
                Próximo vencimiento fiscal
              </div>
              <div className="text-xs text-[var(--text-dim)] mt-1">Modelo 303 · trimestral</div>
              <div className="flex items-baseline gap-2 mt-3">
                <div className="[font-family:var(--font-serif)] text-4xl leading-none">
                  {vatDeadline.day}
                </div>
                <div className="text-sm text-[var(--text-dim)]">{vatDeadline.detail}</div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md p-3 hover:bg-[var(--surface-hover)] transition-colors"
    >
      <span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--surface-raised)] text-[var(--accent)]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-[var(--text)]">{title}</span>
        <span className="block text-xs text-[var(--text-subtle)] truncate">{desc}</span>
      </span>
    </Link>
  );
}

function MobileQuickAction({
  href,
  icon,
  label,
  accent,
}: {
  href: string
  icon: React.ReactNode
  label: string
  accent?: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-2 rounded-xl p-4 min-h-[80px] transition-colors ${
        accent
          ? 'bg-[var(--accent)] text-[var(--bg)]'
          : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium text-center">{label}</span>
    </Link>
  )
}

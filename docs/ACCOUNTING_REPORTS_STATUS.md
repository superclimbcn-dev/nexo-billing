# Accounting and fiscal exports — continuation checkpoint

Updated: 2026-09-10
Branch: `feat/accounting-fiscal-reports`
Base: `4840e2f57ae862c69b942dd702610464f56d280e`

## Authorized scope

Implement PDF/CSV treasury and tax reports and PDF/CSV/ZIP advisor reports.
Use existing data and the unchanged fiscal engine. No data mutations, schema
migrations, push, or deployment as part of this implementation. Present the final
change/validation summary before any deployment.

## Implementation

- `apps/web/src/lib/reports/`: periods, authenticated read-only data collection,
  cash projection, shared report tables, CSV/ZIP, PDF.
- `/api/reports`: session and current company membership required; the tenant
  cannot be supplied in URL parameters; attachments have private/no-store headers.
- `/informes`: advisor report preview with month/quarter/year selection.
- Tesorería: added report period selector, preview and PDF/CSV buttons. The
  existing dashboard queries and widgets are preserved.
- Impuestos: PDF/CSV buttons use the fiscal period already selected on the page.
- The preview, CSV and PDF consume the same report tables. Fiscal totals reuse
  `getFiscalPeriodCalculation`; per-expense deductions call the existing engine.
- Service worker bypasses offline caching for report downloads and their pages.

## Deliberate handling of unavailable data

- Opening bank balance is not recorded: reported as unavailable, not zero.
- Paid invoices without receipt dates retain an empty receipt-date cell and use
  issue date as an explicitly labeled period reference, as the existing treasury
  did. Registered receipts use their actual dates/amounts; partial receipts are
  not counted twice. Paid expenses use `paidAt` only.
- Outstanding accounts are current balances for documents issued through the
  selected end date, including older unpaid documents. They are not historical
  reconstructions of debt at that date.
- Monthly advisor documents are monthly; tax summaries explicitly show the full
  corresponding fiscal quarter. Annual reports retain four independent quarters;
  accumulated Modelo 130 figures are never added together.
- Withholdings, prior tax payments, minoraciones and difficult-justification
  expenses remain unavailable where the current engine has no source.
- Seguridad Social has no structured identifier in existing expense records.
  Its section states that a reliable total is unavailable and refers to the full
  expense list; no text matching or reclassification is performed.

## Validation checkpoint

- Full test suite passed: 272 tests, including 46 new report tests. Two unchanged
  library suites used Turbo cache; all web tests executed.
- TypeScript passed across the monorepo.
- ESLint was previously unconfigured. Installed development tooling and a flat
  config: new/changed reporting files are strict; legacy findings remain warnings
  (24 currently), without unrelated business-code edits.
- Final real long-table PDF generated from synthetic data: 67 pages, all 85
  expenses present, Spanish accents preserved, no words outside page margins.
  Visual inspection confirmed whole normal rows and repeated headers/footers.
- Local production build passed, including `/api/reports` and `/informes`.
  Existing GoCardless/Sanity warnings and a Next ESLint-plugin detection warning
  remain; TypeScript was checked separately across the entire monorepo.
- Fiscal calculation/action files, expense/treasury actions and Prisma schema
  have no changes. No production data was written and no deployment was made.
- Download controls tested against expired-session redirects, unexpected HTML,
  selected format/period and unapplied filter changes. No live authenticated
  browser end-to-end validation was performed.
- Implementation and local validation are complete. Review this summary before
  requesting a push or deployment. The sandbox blocks tsx IPC; execute the full
  test command with the approved unsandboxed execution mechanism.

## Commands

`pnpm test`, `pnpm typecheck`, `pnpm lint`.
For the existing build-script schema-path issue, generate Prisma with the
infrastructure schema and run `next build` in apps/web. Local build may load the
existing environment without printing secrets; do not deploy.

Synthetic PDF/CSV test artifacts can be generated with
`NEXO_REPORT_ARTIFACT_DIR=/tmp/nexo-reports-validation pnpm --filter @nexo/web exec vitest run src/lib/reports/__tests__/reports.actions.test.tsx`.

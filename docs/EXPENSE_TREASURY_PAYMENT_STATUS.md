# Expense payment status — 2026-09-08

## Baseline

Verified against remote main and the active Vercel production deployment:
`c43e777741a7f095acbca037b4177044a4e39cc2` (expense currency normalization).
The previous local branch had identical contents.

## Behavior

- Reuses the existing `ExpenseStatus` enum: `paid` / `pending` represent PAID / PENDING.
  Historical enum values remain intact for compatibility; the simple form offers
  only Pagado and Pendiente.
- New expenses default to Pagado. Paid expenses have a payment date (defaulting
  to the expense date) and an optional payment method. Pending expenses store
  null for both fields.
- Cash out uses only paid expenses, grouped by `paidAt`. Balance and cash alerts
  deduct only realized expenses.
- Payables include only pending expenses, including previous months. No 50-row
  truncation affects the pending total.
- Registrar pago is available in Gastos and Tesorería. It requires date and method,
  checks owner/admin permissions and tenant ownership, and atomically updates only
  pending expenses. It never recalculates expense lines or tax amounts.
- Editing payment details in the expense form preserves existing fiscal amounts
  when amount and VAT rate are unchanged, including legacy VAT breakdowns.
- Fiscal calculations still use the document date and existing deductibility
  rules. The treasury tax label identifies the existing estimate as Modelo 303.

## Migration

`20260908120000_add_expense_payment_details` adds nullable payment fields, changes
only the default payment status, and adds a tenant/status/payment-date index.
Existing paid expenses use the latest recorded outbound payment date/method when
available, otherwise the expense date and an unknown method. Pending and other
historical states remain unchanged. Fiscal columns and lines are untouched.

## Validation

Run `pnpm test` and `pnpm typecheck`. The web test script includes treasury/action
regressions and existing expense/fiscal tests. The production build uses the
existing Vercel build command (or Prisma generation followed by `next build`).

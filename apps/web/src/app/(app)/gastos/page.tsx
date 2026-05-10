import { redirect } from 'next/navigation'
import { createServerClient } from '@nexo/core-auth'
import { listExpenses, getMonthlyTotal } from './_lib/expense-actions'
import { ExpenseList } from './_components/expense-list'
import { ExpenseFilters } from './_components/expense-filters'
import { ExpenseFormWrapper } from './_components/expense-form-wrapper'
import { formatCurrency } from '@nexo/core-utils'

interface Props {
  searchParams: Promise<{
    categoria?: string
    desde?: string
    hasta?: string
  }>
}

export default async function GastosPage({ searchParams }: Props) {
  const params = await searchParams

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const filters = {
    ...(params.categoria ? { category: params.categoria as any } : {}),
    ...(params.desde ? { dateFrom: params.desde } : {}),
    ...(params.hasta ? { dateTo: params.hasta } : {}),
  }

  const [listResult, totalResult] = await Promise.all([
    listExpenses(Object.keys(filters).length > 0 ? filters : undefined),
    getMonthlyTotal(),
  ])

  const expenses = listResult.ok ? listResult.data : []
  const monthlyTotal = totalResult.ok ? totalResult.data : 0

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--text)]">Gastos</h1>
        <ExpenseFormWrapper />
      </div>

      <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
        <p className="text-sm text-[var(--text-dim)]">Total este mes</p>
        <p className="text-2xl font-mono font-semibold text-[var(--text)]">
          {formatCurrency(monthlyTotal)}
        </p>
      </div>

      <ExpenseFilters />

      <ExpenseList items={expenses} />
    </div>
  )
}

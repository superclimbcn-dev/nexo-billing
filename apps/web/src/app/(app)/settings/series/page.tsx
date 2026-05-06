import { redirect } from 'next/navigation'
import { createServerClient } from '@nexo/core-auth'
import { listTenantSeries } from '../_lib/settings-queries'
import { SeriesList } from '../_components/series-list'

export default async function SeriesPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const series = await listTenantSeries(tenantId)
  return <SeriesList series={series} />
}

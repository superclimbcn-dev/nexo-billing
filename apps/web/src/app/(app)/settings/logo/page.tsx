import { redirect } from 'next/navigation'
import { createServerClient } from '@nexo/core-auth'
import { getTenantSettings } from '../_lib/settings-queries'
import { LogoUploader } from '../_components/logo-uploader'

export default async function LogoPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const tenant = await getTenantSettings(tenantId)
  if (!tenant) redirect('/onboarding/cuenta')

  return <LogoUploader currentLogoUrl={tenant.branding?.logoUrl ?? null} />
}

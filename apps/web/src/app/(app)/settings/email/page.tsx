import { redirect } from 'next/navigation'
import { createServerClient } from '@nexo/core-auth'
import { prisma } from '@nexo/prisma'
import { EmailConfigForm } from './_components/email-config-form'

export default async function EmailSettingsPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      emailProvider: true,
      emailFrom: true,
      emailFromName: true,
      emailReplyTo: true,
      emailApiKey: true,
      smtpHost: true,
      smtpPort: true,
      smtpUser: true,
      smtpPass: true,
      smtpSecure: true,
    },
  })

  if (!tenant) redirect('/onboarding/cuenta')

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text)]">
          Configuración de email
        </h2>
        <p className="text-sm text-[var(--text-dim)] mt-1">
          Personaliza el remitente de los emails de facturación.
        </p>
      </div>

      <EmailConfigForm
        initial={{
          provider: (tenant.emailProvider as 'resend' | 'sendgrid' | 'smtp') ?? 'resend',
          from: tenant.emailFrom ?? '',
          fromName: tenant.emailFromName ?? '',
          replyTo: tenant.emailReplyTo ?? '',
          apiKey: '',
          smtpHost: tenant.smtpHost ?? '',
          smtpPort: tenant.smtpPort ?? undefined,
          smtpUser: tenant.smtpUser ?? '',
          smtpPass: '',
          smtpSecure: tenant.smtpSecure ?? true,
        }}
      />
    </div>
  )
}

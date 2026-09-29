import { Button, Panel } from '@nexo/core-ui'
import { acceptInvitation, getInvitationView } from '@/actions/invitations'

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  MEMBER: 'Miembro',
  VIEWER: 'Visor',
  ACCOUNTANT: 'Contable',
}

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ token_hash?: string; type?: string; error?: string }>
}

export default async function InvitationPage({ params, searchParams }: PageProps) {
  const { token } = await params
  const { token_hash: tokenHash = '', type = '', error } = await searchParams
  const invitation = await getInvitationView(token)
  const isPending = invitation?.status === 'PENDING' && invitation.expiresAt > new Date()

  return (
    <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <Panel title="Invitación a Nexo Billing">
          <div className="px-6 py-6 flex flex-col gap-5">
            {!invitation ? (
              <p className="text-sm text-[var(--danger)]">Esta invitación no existe o no es válida.</p>
            ) : (
              <>
                <div>
                  <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
                    Únete a {invitation.tenantName}
                  </h1>
                  <p className="mt-2 text-sm text-[var(--text-dim)]">
                    Accederás como {ROLE_LABELS[invitation.role] ?? invitation.role} con el correo {invitation.email}.
                  </p>
                </div>
                {error && (
                  <p className="text-sm text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-xl px-4 py-3">
                    {error}
                  </p>
                )}
                {!isPending && invitation.status !== 'ACCEPTED' && (
                  <p className="text-sm text-[var(--danger)]">La invitación ha caducado o ha sido revocada.</p>
                )}
                {invitation.status === 'ACCEPTED' && (
                  <p className="text-sm text-[var(--text-dim)]">Esta invitación ya fue aceptada. Puedes confirmar de nuevo para recuperar el acceso.</p>
                )}
                {(isPending || invitation.status === 'ACCEPTED') && (
                  <form action={acceptInvitation}>
                    <input type="hidden" name="invitationToken" value={token} />
                    <input type="hidden" name="tokenHash" value={tokenHash} />
                    <input type="hidden" name="otpType" value={type} />
                    <Button type="submit" variant="primary">Aceptar invitación</Button>
                  </form>
                )}
              </>
            )}
          </div>
        </Panel>
      </div>
    </main>
  )
}

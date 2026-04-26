import { redirect } from 'next/navigation'
import { createServerClient } from '@nexo/core-auth'
import { prisma } from '@nexo/prisma'
import { Panel, Button, FormInput } from '@nexo/core-ui'
import { inviteUser, revokeInvitation, removeTeamMember } from '@/actions/team'

interface PageProps {
  searchParams: Promise<{ error?: string; success?: string }>
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  MEMBER: 'Miembro',
  VIEWER: 'Visor',
  ACCOUNTANT: 'Contable',
}

const INVITE_ROLES = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'MEMBER', label: 'Miembro' },
  { value: 'VIEWER', label: 'Visor' },
  { value: 'ACCOUNTANT', label: 'Contable' },
]

export default async function TeamPage({ searchParams }: PageProps) {
  const { error, success } = await searchParams

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const tenantId = user.app_metadata?.tenant_id as string | undefined
  const currentRole = user.app_metadata?.role as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const canManage = currentRole === 'OWNER' || currentRole === 'ADMIN'

  const [members, invitations] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.invitation.findMany({
      where: { tenantId, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div>
        <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">Equipo</h1>
        <p className="text-sm text-[var(--text-dim)] mt-1">
          Gestiona los miembros y las invitaciones pendientes.
        </p>
      </div>

      {error && (
        <p className="text-sm text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-xl px-4 py-3">
          {decodeURIComponent(error)}
        </p>
      )}
      {success && (
        <p className="text-sm text-[var(--success)] bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-xl px-4 py-3">
          {decodeURIComponent(success)}
        </p>
      )}

      {canManage && (
        <Panel title="Invitar miembro">
          <div className="px-6 py-5">
            <form action={inviteUser} className="flex gap-3 items-end">
              <div className="flex-1">
                <FormInput
                  id="email"
                  name="email"
                  type="email"
                  label="Correo electrónico"
                  placeholder="colega@empresa.com"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5 w-44">
                <label htmlFor="role" className="text-xs text-[var(--text-dim)]">
                  Rol
                </label>
                <select
                  id="role"
                  name="role"
                  defaultValue="MEMBER"
                  className="bg-[var(--bg)] border border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-[var(--text)] text-sm outline-none transition-colors duration-150 focus:border-[var(--accent)]"
                >
                  {INVITE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" variant="primary">
                Invitar
              </Button>
            </form>
          </div>
        </Panel>
      )}

      <Panel title={`Miembros · ${members.length}`}>
        <div className="px-6">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between py-3.5 border-b border-[var(--border)] last:border-0"
            >
              <div className="flex flex-col">
                <span className="text-sm text-[var(--text)]">
                  {member.name ?? member.email}
                </span>
                {member.name && (
                  <span className="text-xs text-[var(--text-subtle)]">{member.email}</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-[var(--text-dim)]">
                  {ROLE_LABELS[member.role] ?? member.role}
                </span>
                {canManage && member.id !== user.id && member.role !== 'OWNER' && (
                  <form action={removeTeamMember}>
                    <input type="hidden" name="userId" value={member.id} />
                    <button
                      type="submit"
                      className="text-xs text-[var(--text-subtle)] hover:text-[var(--danger)] transition-colors cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {invitations.length > 0 && (
        <Panel title={`Invitaciones pendientes · ${invitations.length}`}>
          <div className="px-6">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between py-3.5 border-b border-[var(--border)] last:border-0"
              >
                <div className="flex flex-col">
                  <span className="text-sm text-[var(--text)]">{inv.email}</span>
                  <span className="text-xs text-[var(--text-subtle)]">
                    Caduca {new Date(inv.expiresAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-[var(--text-dim)]">
                    {ROLE_LABELS[inv.role] ?? inv.role}
                  </span>
                  {canManage && (
                    <form action={revokeInvitation}>
                      <input type="hidden" name="invitationId" value={inv.id} />
                      <button
                        type="submit"
                        className="text-xs text-[var(--text-subtle)] hover:text-[var(--danger)] transition-colors cursor-pointer"
                      >
                        Revocar
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  )
}

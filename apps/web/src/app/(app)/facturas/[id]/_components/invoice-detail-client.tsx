interface ClientInfo {
  id: string
  name: string
  nif: string
  legalName: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  postalCode: string | null
}

interface Props {
  client: ClientInfo
}

export function InvoiceDetailClient({ client }: Props) {
  return (
    <section className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
      <h2 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wide mb-3">
        Cliente
      </h2>
      <div className="space-y-1">
        <div className="font-medium text-lg text-[var(--text)]">{client.name}</div>
        {client.legalName && client.legalName !== client.name && (
          <div className="text-sm text-[var(--text-dim)]">{client.legalName}</div>
        )}
        <div className="text-sm font-mono text-[var(--text-dim)]">NIF: {client.nif}</div>
        {(client.address || client.city || client.postalCode) && (
          <div className="text-sm text-[var(--text-dim)] mt-2 space-y-0.5">
            {client.address && <div>{client.address}</div>}
            {(client.postalCode || client.city) && (
              <div>{[client.postalCode, client.city].filter(Boolean).join(' ')}</div>
            )}
          </div>
        )}
        {client.email && (
          <div className="text-sm text-[var(--text-dim)] mt-2">{client.email}</div>
        )}
        {client.phone && <div className="text-sm text-[var(--text-dim)]">{client.phone}</div>}
      </div>
    </section>
  )
}

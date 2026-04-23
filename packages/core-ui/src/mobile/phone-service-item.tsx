import { cn } from '../primitives/cn'

export type ServiceStatus = 'done' | 'in-progress' | 'pending'

export interface PhoneServiceItemProps {
  time: string
  client: string
  address: string
  status: ServiceStatus
  className?: string
}

const statusIcon: Record<ServiceStatus, string> = {
  done: '✓',
  'in-progress': '▸',
  pending: '·',
}

export function PhoneServiceItem({
  time,
  client,
  address,
  status,
  className,
}: PhoneServiceItemProps) {
  return (
    <div
      className={cn(
        'bg-[var(--surface)] border border-[var(--border)] rounded-[16px] p-3.5 mb-2.5 flex items-center gap-3',
        className
      )}
    >
      <div className="[font-family:var(--font-mono)] text-[11px] text-[var(--text-subtle)] w-11 flex-shrink-0">
        {time}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold mb-0.5">{client}</div>
        <div className="text-[11px] text-[var(--text-dim)] truncate">{address}</div>
      </div>
      <div
        className={cn(
          'w-6 h-6 rounded-full grid place-items-center flex-shrink-0 text-xs',
          status === 'done' && 'bg-[var(--success)] text-black',
          status === 'in-progress' && 'bg-[var(--accent)] text-black animate-nexo-pulse',
          status === 'pending' && 'bg-[var(--surface-raised)] text-[var(--text-subtle)] border border-[var(--border)]'
        )}
      >
        {statusIcon[status]}
      </div>
    </div>
  )
}

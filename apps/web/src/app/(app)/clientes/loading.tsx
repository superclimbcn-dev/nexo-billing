import { Skeleton } from '@/components/ui/skeleton'

export default function ClientesLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </header>

      {/* Search */}
      <Skeleton className="h-10 w-80 rounded-md" />

      {/* Client list */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border border-[var(--border)] rounded-lg">
            {/* Avatar */}
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
            {/* Info */}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
            {/* Actions */}
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}

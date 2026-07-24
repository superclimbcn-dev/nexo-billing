import { Skeleton } from '@nexo/core-ui'

export default function TesoreriaLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header>
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-40 mt-2" />
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>

      {/* Chart */}
      <Skeleton className="h-80 w-full rounded-lg" />

      {/* Recent transactions */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 border border-[var(--border)] rounded-md">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

import { Skeleton } from '@/components/ui/skeleton'

export default function ProductosLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </header>

      {/* Search */}
      <Skeleton className="h-10 w-80 rounded-md" />

      {/* Product grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 border border-[var(--border)] rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

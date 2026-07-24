import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48 mt-2" />
      </header>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-t-md" />
        ))}
      </div>

      {/* Form content */}
      <div className="space-y-6 max-w-2xl">
        {/* Section 1 */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-36" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>

        {/* Save button */}
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  )
}

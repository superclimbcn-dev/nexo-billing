'use client'

function Skeleton({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[var(--surface-raised)] ${className}`}
      {...props}
    />
  )
}

export { Skeleton }

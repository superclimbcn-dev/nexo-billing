import { cn } from './cn'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[var(--surface-raised)]',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }

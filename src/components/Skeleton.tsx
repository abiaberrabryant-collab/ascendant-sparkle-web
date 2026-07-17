import type { HTMLAttributes } from "react";

/**
 * Neutral loading placeholder. Compose these to build page-level skeletons.
 */
export function Skeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={
        "animate-pulse rounded-md bg-foreground/10 " + className
      }
      {...props}
    />
  );
}

export function AccountSkeleton() {
  return (
    <div className="mt-10 space-y-8" aria-busy="true" aria-label="Loading account">
      <div className="rounded-3xl border border-glass-border bg-glass p-8">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-4 h-8 w-40" />
        <Skeleton className="mt-3 h-4 w-56" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <div className="rounded-3xl border border-glass-border bg-glass p-8">
        <Skeleton className="h-3 w-32" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

interface LoadingSkeletonProps {
  rows?: number
  className?: string
}

function LoadingSkeleton({
  rows = 4,
  className = "",
}: LoadingSkeletonProps) {
  return (
    <div
      className={`animate-pulse space-y-4 ${className}`}
      aria-label="Loading content"
    >
      {Array.from({ length: rows }).map(
        (_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-4 h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
            <div className="mt-2 h-3 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        ),
      )}
    </div>
  )
}

export default LoadingSkeleton

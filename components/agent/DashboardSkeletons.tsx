export function StatsSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 space-y-3"
          >
            <div className="h-3.5 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-7 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-700/50" />
          </div>
        ))}
      </div>
      <div className="h-64 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
    </div>
  );
}

export function ListingsSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden mt-10">
      <div className="h-12 bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 px-4 py-3.5 border-b border-slate-100 dark:border-slate-700/50 last:border-0"
        >
          <div className="h-4 w-1/4 rounded bg-slate-100 dark:bg-slate-700" />
          <div className="h-4 w-1/4 rounded bg-slate-100 dark:bg-slate-700" />
          <div className="h-4 w-1/4 rounded bg-slate-100 dark:bg-slate-700" />
          <div className="h-4 w-1/6 rounded bg-slate-100 dark:bg-slate-700" />
        </div>
      ))}
    </div>
  );
}

export default function Loading() {
  return (
    <div className="animate-pulse p-6 space-y-6">
      {/* Page title */}
      <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-700" />

      {/* 4 stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800 p-4 space-y-2">
            <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-6 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="h-56 rounded-xl bg-slate-100 dark:bg-slate-800" />

      {/* Table skeleton */}
      <div className="rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className="h-10 bg-slate-200 dark:bg-slate-700" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <div className="h-4 w-1/4 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-1/4 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-1/4 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-1/4 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

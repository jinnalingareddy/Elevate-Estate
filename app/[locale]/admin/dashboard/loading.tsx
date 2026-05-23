export default function Loading() {
  return (
    <div className="animate-pulse p-6 space-y-6">
      {/* Page title */}
      <div className="h-8 w-56 rounded bg-slate-200 dark:bg-slate-700" />

      {/* 4 stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800 p-4 space-y-2">
            <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-6 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>

      {/* Activity log list */}
      <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-4 space-y-3">
        <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700 mb-4" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

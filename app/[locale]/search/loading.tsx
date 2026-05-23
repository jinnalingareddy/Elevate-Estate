export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Navbar-height spacer */}
      <div className="h-16 w-full bg-slate-100 dark:bg-slate-800 mb-4" />

      {/* Filter bar skeletons */}
      <div className="px-6 space-y-3 mb-6">
        <div className="h-10 w-full rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="h-10 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="h-10 w-1/2 rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* Property card grid — 8 cards */}
      <div className="px-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-40 bg-slate-200 dark:bg-slate-700" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

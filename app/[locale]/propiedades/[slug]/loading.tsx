export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Full-width hero image skeleton */}
      <div className="h-72 sm:h-96 w-full bg-slate-200 dark:bg-slate-700" />

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Title */}
        <div className="h-8 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />

        {/* Price */}
        <div className="h-7 w-40 rounded bg-slate-200 dark:bg-slate-700" />

        {/* Description lines */}
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-4 w-5/6 rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-4 w-4/6 rounded bg-slate-100 dark:bg-slate-800" />
        </div>

        {/* Detail chips */}
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-24 rounded-full bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    </div>
  );
}

import { AgentSidebar } from "@/components/layout/AgentSidebar";

export default function Loading() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AgentSidebar />
      <main className="flex-1 lg:pl-64 px-4 sm:px-8 pb-8 pt-14 lg:pt-8">
        <div className="animate-pulse space-y-6">
          {/* Title */}
          <div className="space-y-1.5">
            <div className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-72 rounded bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* 4 stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-4 space-y-2"
              >
                <div className="h-7 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-700/50" />
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="h-11 bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 px-4 py-3.5 border-b border-slate-100 dark:border-slate-700/50 last:border-0"
              >
                <div className="h-4 w-1/4 rounded bg-slate-100 dark:bg-slate-700" />
                <div className="h-4 w-1/4 rounded bg-slate-100 dark:bg-slate-700" />
                <div className="h-4 w-1/5 rounded bg-slate-100 dark:bg-slate-700" />
                <div className="h-4 w-1/6 rounded bg-slate-100 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

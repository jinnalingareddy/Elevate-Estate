import { AgentSidebar } from "@/components/layout/AgentSidebar";

export default function Loading() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AgentSidebar />
      <main className="flex-1 lg:pl-64 px-4 sm:px-8 pb-8 pt-14 lg:pt-8">
        <div className="animate-pulse space-y-6">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="h-8 w-44 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-9 w-36 rounded-lg bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Limit bar */}
          <div className="h-10 w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />

          {/* Listing cards */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 flex gap-4"
            >
              <div className="h-20 w-28 rounded-lg bg-slate-200 dark:bg-slate-700 shrink-0" />
              <div className="flex-1 space-y-2.5">
                <div className="h-5 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3.5 w-1/2 rounded bg-slate-100 dark:bg-slate-700/60" />
                <div className="h-3.5 w-1/3 rounded bg-slate-100 dark:bg-slate-700/60" />
              </div>
              <div className="h-7 w-20 rounded-lg bg-slate-100 dark:bg-slate-700/50 self-start shrink-0" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

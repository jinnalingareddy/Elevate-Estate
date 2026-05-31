import { AgentSidebar } from "@/components/layout/AgentSidebar";

export default function Loading() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AgentSidebar />
      <main className="flex-1 lg:pl-64 px-4 sm:px-8 pb-8 pt-14 lg:pt-8">
        <div className="animate-pulse space-y-8">
          {/* Title */}
          <div className="space-y-1.5">
            <div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-72 rounded bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-4"
              >
                <div className="h-5 w-16 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-8 w-28 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="space-y-2.5">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-3.5 w-full rounded bg-slate-100 dark:bg-slate-700/50" />
                  ))}
                </div>
                <div className="h-10 w-full rounded-lg bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

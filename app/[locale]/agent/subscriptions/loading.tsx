import { AgentSidebar } from "@/components/layout/AgentSidebar";

export default function Loading() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AgentSidebar />
      <main className="flex-1 lg:pl-64 px-4 sm:px-8 pb-8 pt-14 lg:pt-8 max-w-3xl">
        <div className="animate-pulse space-y-6">
          {/* Title */}
          <div className="h-8 w-36 rounded-lg bg-slate-200 dark:bg-slate-700" />

          {/* Plan card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-4">
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-8 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3.5 w-40 rounded bg-slate-100 dark:bg-slate-700/50" />
              </div>
              <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="flex gap-3">
              <div className="h-9 w-32 rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="h-9 w-36 rounded-lg bg-slate-100 dark:bg-slate-700/50" />
            </div>
          </div>

          {/* Usage grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-4 space-y-2"
              >
                <div className="h-3.5 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-7 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700" />
              </div>
            ))}
          </div>

          {/* Billing history */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <div className="space-y-1.5">
                  <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-32 rounded bg-slate-100 dark:bg-slate-700/50" />
                </div>
                <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700 self-center" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

import { AgentSidebar } from "@/components/layout/AgentSidebar";

export default function Loading() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AgentSidebar />
      <main className="flex-1 lg:pl-64 px-4 sm:px-8 pb-8 pt-14 lg:pt-8">
        <div className="animate-pulse space-y-8 max-w-2xl">
          {/* Title */}
          <div className="space-y-1.5">
            <div className="h-8 w-40 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-64 rounded bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Profile card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-5 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3.5 w-1/2 rounded bg-slate-100 dark:bg-slate-700/60" />
              </div>
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-10 w-full rounded-lg bg-slate-100 dark:bg-slate-700/50" />
              </div>
            ))}
            <div className="h-9 w-28 rounded-lg bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Security card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-4">
            <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-10 w-full rounded-lg bg-slate-100 dark:bg-slate-700/50" />
            <div className="h-9 w-40 rounded-lg bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </main>
    </div>
  );
}

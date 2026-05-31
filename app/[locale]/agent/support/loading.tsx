import { AgentSidebar } from "@/components/layout/AgentSidebar";

export default function Loading() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AgentSidebar />
      <main className="flex-1 lg:pl-64 px-4 sm:px-8 pb-8 pt-14 lg:pt-8">
        <div className="animate-pulse space-y-8 max-w-2xl">
          <div className="space-y-1.5">
            <div className="h-8 w-28 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-64 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-3"
            >
              <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-700/50" />
              <div className="h-4 w-5/6 rounded bg-slate-100 dark:bg-slate-700/50" />
              <div className="h-9 w-32 rounded-lg bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

import { AgentSidebar } from "@/components/layout/AgentSidebar";

export default function Loading() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AgentSidebar />
      <main className="flex-1 lg:pl-64 px-4 sm:px-8 pb-8 pt-14 lg:pt-8 max-w-3xl">
        <div className="animate-pulse space-y-6">
          {/* Back link */}
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />

          {/* Title */}
          <div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-700" />

          {/* Form fields */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3.5 w-28 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-11 w-full rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            </div>
          ))}

          {/* Photo area */}
          <div className="h-40 w-full rounded-xl bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600" />

          {/* Submit */}
          <div className="h-10 w-44 rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>
      </main>
    </div>
  );
}

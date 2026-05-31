import { AgentSidebar } from "@/components/layout/AgentSidebar";
import { StatsSkeleton, ListingsSkeleton } from "@/components/agent/DashboardSkeletons";

export default function Loading() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AgentSidebar />
      <main className="flex-1 lg:pl-64">
        <div className="px-4 sm:px-8 pb-8 pt-14 lg:pt-8">
          {/* Page title */}
          <div className="animate-pulse space-y-1 mb-8">
            <div className="h-8 w-40 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-64 rounded-lg bg-slate-200 dark:bg-slate-700 mt-2" />
          </div>

          <StatsSkeleton />
          <ListingsSkeleton />
        </div>
      </main>
    </div>
  );
}

import { config } from "@/lib/config";
import { PlanConfigProvider } from "@/lib/plan-config-context";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PlanConfigProvider
      value={{ plans: config.plans, payPerListing: config.payPerListing }}
    >
      {children}
    </PlanConfigProvider>
  );
}

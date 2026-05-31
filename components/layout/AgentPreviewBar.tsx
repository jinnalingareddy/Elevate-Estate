"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Eye, LayoutDashboard, PlusSquare, X } from "lucide-react";
import { Link } from "@/lib/navigation";
import { useClientAuth } from "@/components/providers/ClientAuthProvider";
import { cn } from "@/lib/utils";

const PLAN_LABEL: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  elite: "Elite",
};

const PLAN_COLOR: Record<string, string> = {
  free: "bg-slate-700 text-slate-200",
  pro:  "bg-emerald-700 text-emerald-100",
  elite:"bg-gold-600 text-white",
};

export function AgentPreviewBar() {
  const pathname = usePathname();
  const { profile } = useClientAuth();
  const [dismissed, setDismissed] = useState(false);

  const isAgentOrAdmin =
    pathname.includes("/agent/") || pathname.includes("/admin/") || pathname.includes("/search");

  // Only show for agent/admin roles on public pages
  const agentProfile =
    !isAgentOrAdmin &&
    profile &&
    (profile.role === "agent" || profile.role === "admin")
      ? profile
      : null;

  // Reset dismiss state when navigating to a new page
  useEffect(() => { setDismissed(false); }, [pathname]);

  const visible = agentProfile !== null && !dismissed;

  // Push the Navbar down by the bar's height via CSS variable
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--preview-bar-h", visible ? "36px" : "0px");
    return () => root.style.setProperty("--preview-bar-h", "0px");
  }, [visible]);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed top-0 inset-x-0 z-[1010]",       // above Navbar (z-1000)
        "bg-slate-900 border-b border-slate-700",
        "flex items-center justify-between",
        "px-4 h-9 gap-3",
        "transition-all duration-200",
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
      )}
    >
          {/* Left: context label */}
          <div className="flex items-center gap-2 min-w-0">
            <Eye className="h-3.5 w-3.5 text-gold-400 shrink-0" aria-hidden />
            <span className="text-xs text-slate-300 hidden sm:block">
              Vista de comprador
            </span>
            <span className="text-xs text-slate-500 hidden sm:block">·</span>
            <span className="text-xs text-white font-medium truncate">
              {agentProfile?.full_name?.split(" ")[0] ?? "Agente"}
            </span>
            {agentProfile?.plan && (
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                PLAN_COLOR[agentProfile.plan] ?? PLAN_COLOR.free
              )}>
                {PLAN_LABEL[agentProfile.plan] ?? agentProfile.plan}
              </span>
            )}
          </div>

          {/* Right: quick actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href="/agent/listings/new"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <PlusSquare className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:block">Nueva propiedad</span>
            </Link>

            <Link
              href="/agent/dashboard"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gold-500 hover:bg-gold-400 text-white transition-colors"
            >
              <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
              <span>Dashboard</span>
            </Link>

            <button
              onClick={() => setDismissed(true)}
              aria-label="Cerrar barra de vista previa"
              className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors ml-1"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
    </div>
  );
}

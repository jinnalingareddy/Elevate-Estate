"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  Building2,
  CreditCard,
  ExternalLink,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { Link } from "@/lib/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getThumbnailUrl } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import type { PlanType } from "@/lib/supabase/types";
import { useClientAuth, type AuthProfile } from "@/components/providers/ClientAuthProvider";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Plan badge ───────────────────────────────────────────────────────────────

function PlanBadge({ plan, t }: { plan: PlanType; t: ReturnType<typeof useTranslations<"agent.sidebar">> }) {
  if (plan === "pro") {
    return <Badge variant="success">{t("planPro")}</Badge>;
  }
  if (plan === "elite") {
    return <Badge variant="warning">{t("planElite")}</Badge>;
  }
  return <Badge variant="default">{t("planFree")}</Badge>;
}

// ─── Nav item ─────────────────────────────────────────────────────────────────

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}

function SidebarNavItem({ href, icon: Icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium",
        "transition-colors duration-150",
        active
          ? "border-l-2 border-gold-500 pl-[14px] text-gold-400 bg-white/5"
          : "border-l-2 border-transparent text-slate-400 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}

// ─── Sidebar content (shared between desktop + mobile) ────────────────────────

interface SidebarContentProps {
  profile: AuthProfile | null;
  plan: PlanType;
  pathname: string;
  t: ReturnType<typeof useTranslations<"agent.sidebar">>;
  onLogout: () => void;
}

function SidebarContent({
  profile,
  plan,
  pathname,
  t,
  onLogout,
}: SidebarContentProps) {
  const navItems = [
    { href: "/agent/dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { href: "/agent/listings", icon: Building2, label: t("listings") },
    { href: "/agent/leads", icon: Users, label: t("leads") },
    { href: "/agent/subscriptions", icon: CreditCard, label: t("subscriptions") },
    { href: "/agent/plans", icon: Package, label: t("plans") },
    { href: "/agent/settings", icon: Settings, label: t("settings") },
    { href: "/agent/support", icon: HelpCircle, label: t("support") },
  ];

  return (
    <div className="flex h-full flex-col bg-slate-950 text-white">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <Link href="/">
          <span className="font-serif text-xl font-bold">
            Estate<span className="text-gold-500">Elevate</span>
          </span>
        </Link>
      </div>

      {/* Agent info */}
      <div className="px-4 py-4 border-b border-slate-800">
        {/* Avatar */}
        <div className="flex items-center gap-3 mb-3">
          {profile?.avatar_url ? (
            <div className="relative h-10 w-10 rounded-full overflow-hidden shrink-0">
              <Image
                src={getThumbnailUrl(profile.avatar_url)}
                alt={profile.full_name ?? "Avatar"}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-gold-500 flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">
                {getInitials(profile?.full_name ?? null)}
              </span>
            </div>
          )}

          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {profile?.full_name ?? "Agente"}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {profile?.email ?? ""}
            </p>
          </div>
        </div>

        <PlanBadge plan={plan} t={t} />

        {/* New listing CTA */}
        <Button asChild variant="primary" fullWidth className="mt-3">
          <Link href="/agent/listings/new">{t("newProperty")}</Link>
        </Button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
        {navItems.map(({ href, icon, label }) => (
          <SidebarNavItem
            key={href}
            href={href}
            icon={icon}
            label={label}
            active={pathname.startsWith(href)}
          />
        ))}
      </nav>

      {/* Footer: website link + logout */}
      <div className="px-4 py-4 border-t border-slate-800 space-y-1">
        <Link
          href="/"
          className={cn(
            "flex w-full items-center gap-3 px-4 py-2.5 rounded-lg",
            "text-sm font-medium text-slate-400",
            "hover:text-white hover:bg-white/5 transition-colors"
          )}
        >
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
          Ver sitio web
        </Link>
        <button
          onClick={onLogout}
          className={cn(
            "flex w-full items-center gap-3 px-4 py-2.5 rounded-lg",
            "text-sm font-medium text-slate-400",
            "hover:text-red-400 hover:bg-white/5 transition-colors"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          {t("logout")}
        </button>
      </div>
    </div>
  );
}

// ─── AgentSidebar ─────────────────────────────────────────────────────────────

export function AgentSidebar() {
  const t = useTranslations("agent.sidebar");
  const pathname = usePathname();
  const router = useRouter();

  const { profile: authProfile } = useClientAuth();
  const plan = (authProfile?.plan ?? "free") as PlanType;
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/agent/auth");
  }

  const sharedProps: SidebarContentProps = {
    profile: authProfile,
    plan,
    pathname,
    t,
    onLogout: handleLogout,
  };

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col">
        <SidebarContent {...sharedProps} />
      </aside>

      {/* ── Mobile: top header bar ────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 shadow-lg">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
          className="p-2 -ml-2 rounded-lg text-white hover:bg-white/10 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/">
          <span className="font-serif text-lg font-bold text-white select-none">
            Estate<span className="text-gold-500">Elevate</span>
          </span>
        </Link>
        <div className="w-9" aria-hidden />
      </div>

      {/* ── Mobile slide-in ───────────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        aria-hidden={!mobileOpen}
        className={cn(
          "lg:hidden fixed inset-0 z-40 bg-black/60 transition-opacity duration-200",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Panel */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-72",
          "transition-transform duration-200 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          className="absolute top-4 right-4 p-1.5 rounded-md text-slate-400 hover:text-white"
          onClick={() => setMobileOpen(false)}
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent {...sharedProps} />
      </aside>
    </>
  );
}

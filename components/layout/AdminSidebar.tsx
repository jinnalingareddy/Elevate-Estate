"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react";
import { Link } from "@/lib/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// ─── Nav item ─────────────────────────────────────────────────────────────────

function AdminNavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
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

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent({
  pathname,
  onLogout,
}: {
  pathname: string;
  onLogout: () => void;
}) {
  const t = useTranslations("admin.sidebar");

  const navItems = [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { href: "/admin/agents", icon: Users, label: t("agents") },
    { href: "/admin/listings", icon: Building2, label: t("listings") },
    { href: "/admin/audit", icon: ClipboardList, label: t("auditLog") },
  ];

  return (
    <div className="flex h-full flex-col bg-slate-950 text-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-800">
        <Link href="/">
          <span className="font-serif text-xl font-bold">
            Estate<span className="text-gold-500">Elevate</span>
          </span>
        </Link>
        <p className="mt-1 text-xs text-slate-500 font-medium uppercase tracking-wider">
          {t("title")}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
        {navItems.map(({ href, icon, label }) => (
          <AdminNavItem
            key={href}
            href={href}
            icon={icon}
            label={label}
            active={pathname.startsWith(href)}
          />
        ))}
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-slate-800">
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

// ─── AdminSidebar ─────────────────────────────────────────────────────────────

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/agent/auth");
  }

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col">
        <SidebarContent pathname={pathname} onLogout={handleLogout} />
      </aside>

      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-950 text-white shadow-lg"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú de administración"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile slide-in */}
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
        <SidebarContent pathname={pathname} onLogout={handleLogout} />
      </aside>
    </>
  );
}

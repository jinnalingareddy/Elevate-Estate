"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname as useNextPathname } from "next/navigation";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PlusSquare,
  Sun,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { Link, useI18nPathname } from "@/lib/navigation";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useClientAuth } from "@/components/providers/ClientAuthProvider";
import { getThumbnailUrl } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/supabase/types";

// ─── Logo ─────────────────────────────────────────────────────────────────────

function Logo({ white = false }: { white?: boolean }) {
  return (
    <span
      className={cn(
        "font-serif text-xl font-bold select-none",
        white ? "text-white" : "text-slate-900 dark:text-white"
      )}
    >
      Estate
      <span className="text-gold-500">Elevate</span>
    </span>
  );
}

// ─── Nav items ────────────────────────────────────────────────────────────────

interface NavItem {
  labelKey: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: "buy", href: "/search?mode=buy" },
  { labelKey: "rent", href: "/search?mode=rent" },
  { labelKey: "sell", href: "/search?mode=sell" },
  { labelKey: "agents", href: "/search?agents=true" },
];

// ─── Agent avatar dropdown ────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return "A";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface AgentDropdownProps {
  profile: Profile;
  scrolled: boolean;
  onLogout: () => void;
}

function AgentDropdown({ profile, scrolled, onLogout }: AgentDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors",
          scrolled
            ? "hover:bg-slate-100 dark:hover:bg-slate-800"
            : "hover:bg-white/10"
        )}
        aria-label="Menú de agente"
        aria-expanded={open}
      >
        {/* Avatar */}
        <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 ring-2 ring-gold-400">
          {profile.avatar_url ? (
            <Image
              src={getThumbnailUrl(profile.avatar_url)}
              alt={profile.full_name ?? "Agente"}
              width={32}
              height={32}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="h-full w-full bg-gold-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {getInitials(profile.full_name)}
              </span>
            </div>
          )}
        </div>

        {/* Name (desktop) */}
        <span
          className={cn(
            "hidden md:block text-sm font-medium max-w-[120px] truncate",
            scrolled ? "text-slate-800 dark:text-slate-100" : "text-white"
          )}
        >
          {profile.full_name?.split(" ")[0] ?? "Agente"}
        </span>

        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform hidden md:block",
            scrolled ? "text-slate-500" : "text-white/70",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {/* Dropdown panel */}
      <div
        className={cn(
          "absolute right-0 mt-2 w-56 rounded-xl shadow-lg border z-50 overflow-hidden",
          "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700",
          "transition-all duration-150 origin-top-right",
          open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}
      >
            {/* Identity header */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {profile.full_name ?? "Agente"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {profile.email}
              </p>
              {profile.agency_name && (
                <p className="text-xs text-gold-600 dark:text-gold-400 mt-0.5 truncate">
                  {profile.agency_name}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="py-1">
              <Link
                href="/agent/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 text-slate-400" aria-hidden />
                Mi Dashboard
              </Link>

              <Link
                href="/agent/listings/new"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <PlusSquare className="h-4 w-4 text-slate-400" aria-hidden />
                Publicar propiedad
              </Link>

              <Link
                href="/agent/leads"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <User className="h-4 w-4 text-slate-400" aria-hidden />
                Mis prospectos
              </Link>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 py-1">
              <button
                onClick={() => { setOpen(false); onLogout(); }}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Cerrar sesión
              </button>
            </div>
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const i18nPathname = useI18nPathname();
  const nextPathname = useNextPathname();
  const { theme, toggleTheme } = useTheme();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { profile: authProfile, authLoading, signOut } = useClientAuth();

  // Only expose agent UI for agent/admin roles
  const agentProfile =
    authProfile &&
    (authProfile.role === "agent" || authProfile.role === "admin")
      ? (authProfile as unknown as Profile)
      : null;

  // Detect home page for transparent-on-top behaviour
  const isHome = i18nPathname === "/";

  // ── Scroll behaviour ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isHome) { setScrolled(true); return; }

    const sentinel = document.getElementById("hero-sentinel");
    if (sentinel) {
      const observer = new IntersectionObserver(
        ([entry]) => setScrolled(!entry.isIntersecting),
        { threshold: 0 }
      );
      observer.observe(sentinel);
      return () => observer.disconnect();
    }

    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [nextPathname]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function isActive(href: string) {
    return i18nPathname === href.split("?")[0];
  }

  const otherLocale = locale === "es" ? "en" : "es";
  void otherLocale; // used via Link locale prop

  const navbarBg = scrolled
    ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-sm"
    : "bg-transparent";
  const textColor = scrolled
    ? "text-slate-700 dark:text-slate-200"
    : "text-white";
  const logoWhite = !scrolled;

  async function handleLogout() {
    await signOut();
    window.location.href = "/";
  }

  const isLoggedIn = !authLoading && agentProfile !== null;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 z-50 transition-all duration-300",
          navbarBg
        )}
        style={{ top: "var(--preview-bar-h, 0px)", paddingTop: "env(safe-area-inset-top)" }}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">

            {/* LEFT: Logo */}
            <Link href="/" className="shrink-0">
              <Logo white={logoWhite} />
            </Link>

            {/* CENTER: Desktop nav links + Favorites */}
            <ul className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map(({ labelKey, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      textColor,
                      isActive(href)
                        ? "text-gold-500 underline underline-offset-4 decoration-gold-500"
                        : scrolled
                          ? "hover:text-gold-600 dark:hover:text-gold-400"
                          : "hover:text-gold-400"
                    )}
                  >
                    {t(labelKey as "buy" | "rent" | "sell" | "agents")}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/favorites"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    textColor,
                    isActive("/favorites")
                      ? "text-gold-500 underline underline-offset-4 decoration-gold-500"
                      : scrolled
                        ? "hover:text-gold-600 dark:hover:text-gold-400"
                        : "hover:text-gold-400"
                  )}
                >
                  <Heart className="h-4 w-4" aria-hidden />
                  {t("favorites")}
                </Link>
              </li>
            </ul>

            {/* RIGHT: Controls */}
            <div className="flex items-center gap-2">
              {/* Locale toggle */}
              <div
                className={cn(
                  "hidden sm:flex items-center rounded-md overflow-hidden border",
                  scrolled
                    ? "border-slate-200 dark:border-slate-700"
                    : "border-white/30"
                )}
              >
                <Link
                  href={i18nPathname}
                  locale="es"
                  onClick={() => localStorage.setItem("locale", "es")}
                  className={cn(
                    "px-2 py-1 text-xs font-semibold transition-colors",
                    locale === "es"
                      ? "text-gold-500 bg-gold-50/80 dark:bg-gold-900/30"
                      : cn(textColor, "hover:text-gold-400")
                  )}
                >
                  ES
                </Link>
                <span className={cn("w-px h-4 self-center", scrolled ? "bg-slate-200 dark:bg-slate-700" : "bg-white/30")} />
                <Link
                  href={i18nPathname}
                  locale="en"
                  onClick={() => localStorage.setItem("locale", "en")}
                  className={cn(
                    "px-2 py-1 text-xs font-semibold transition-colors",
                    locale === "en"
                      ? "text-gold-500 bg-gold-50/80 dark:bg-gold-900/30"
                      : cn(textColor, "hover:text-gold-400")
                  )}
                >
                  EN
                </Link>
              </div>

              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
                className={cn(
                  "p-2.5 min-h-[44px] min-w-[44px] rounded-md transition-colors",
                  scrolled
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                )}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
              </button>

              {/* ── Auth-aware right section ─────────────────────────────── */}
              <div className="hidden sm:flex items-center gap-2">
                {authLoading ? (
                  // Skeleton placeholder so layout doesn't shift
                  <div className="h-8 w-24 rounded-lg bg-white/10 animate-pulse" />
                ) : isLoggedIn ? (
                  // ── LOGGED IN: avatar dropdown ──────────────────────────
                  <AgentDropdown
                    profile={agentProfile!}
                    scrolled={scrolled}
                    onLogout={handleLogout}
                  />
                ) : (
                  // ── LOGGED OUT: original CTA buttons ────────────────────
                  <>
                    <Link
                      href="/agent/auth"
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border",
                        scrolled
                          ? "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-gold-400 hover:text-gold-600 dark:hover:text-gold-400"
                          : "border-white/30 text-white hover:text-gold-400 hover:border-white/50"
                      )}
                    >
                      <User className="h-3.5 w-3.5" aria-hidden />
                      {t("login/register")}
                    </Link>
                  </>
                )}
              </div>

              {/* Hamburger (mobile) */}
              <button
                className={cn(
                  "lg:hidden p-3 min-h-[44px] min-w-[44px] rounded-md transition-colors",
                  scrolled
                    ? "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    : "text-white hover:bg-white/10"
                )}
                onClick={() => setMenuOpen((o) => !o)}
                aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/40 lg:hidden transition-opacity duration-200",
          menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMenuOpen(false)}
      />

      {/* Mobile slide-down drawer */}
      <div
        className={cn(
          "fixed inset-x-0 z-40 lg:hidden",
          "bg-white dark:bg-slate-900",
          "border-b border-slate-200 dark:border-slate-700 shadow-lg",
          "transition-all duration-200 origin-top",
          menuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        )}
        style={{ top: "calc(var(--preview-bar-h, 0px) + 64px)" }}
      >
            <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-1">
              {NAV_ITEMS.map(({ labelKey, href }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive(href)
                      ? "text-gold-600 bg-gold-50 dark:bg-gold-900/20 dark:text-gold-400"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  {t(labelKey as "buy" | "rent" | "sell" | "agents")}
                </Link>
              ))}

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

              {isLoggedIn ? (
                // ── Mobile: logged-in agent actions ──────────────────────
                <>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="h-9 w-9 rounded-full bg-gold-500 flex items-center justify-center shrink-0 ring-2 ring-gold-300">
                      <span className="text-white text-xs font-bold">
                        {getInitials(agentProfile!.full_name)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {agentProfile!.full_name ?? "Agente"}
                      </p>
                      {agentProfile!.agency_name && (
                        <p className="text-xs text-gold-600 dark:text-gold-400 truncate">
                          {agentProfile!.agency_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <Link href="/agent/dashboard" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <LayoutDashboard className="h-4 w-4 text-slate-400" aria-hidden />
                    Mi Dashboard
                  </Link>
                  <Link href="/favorites" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Heart className="h-4 w-4 text-slate-400" aria-hidden />
                    {t("favorites")}
                  </Link>
                  <Link href="/agent/listings/new" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <PlusSquare className="h-4 w-4 text-slate-400" aria-hidden />
                    Publicar propiedad
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                    Cerrar sesión
                  </button>
                </>
              ) : (
                // ── Mobile: logged-out actions ────────────────────────────
                <>
                  <Link href="/agent/auth" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <User className="h-4 w-4" aria-hidden />
                    {t("login/register")}
                  </Link>
                  <Link href="/favorites" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Heart className="h-4 w-4" aria-hidden />
                    {t("favorites")}
                  </Link>
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                </>
              )}

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

              {/* Locale toggle mobile */}
              <div className="flex gap-2 px-2">
                <Link href={i18nPathname} locale="es" onClick={() => localStorage.setItem("locale", "es")}
                  className={cn("px-3 py-1.5 rounded-md text-sm font-medium",
                    locale === "es" ? "bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  )}>
                  Español
                </Link>
                <Link href={i18nPathname} locale="en" onClick={() => localStorage.setItem("locale", "en")}
                  className={cn("px-3 py-1.5 rounded-md text-sm font-medium",
                    locale === "en" ? "bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  )}>
                  English
                </Link>
              </div>
            </div>
      </div>
    </>
  );
}

import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import {
  authLimiter,
  apiLimiter,
  checkoutLimiter,
  leadFormLimiter,
  applyRateLimit,
  getClientIp,
} from "@/lib/rate-limit";

// ─── Role-cookie helpers ──────────────────────────────────────────────────────
// Cache the DB role lookup in a short-lived, HMAC-signed httpOnly cookie so
// protected pages skip the profile query on every request.

const ROLE_COOKIE = "__ee_r";
const ROLE_TTL_SEC = 1800; // 30 minutes — role changes are rare; saves a DB round-trip per 5-min expiry

// Module-level cache for the HMAC CryptoKey to avoid re-importing on every request.
let _roleKey: CryptoKey | null = null;

// Use a dedicated secret if set; fall back to anon key (both are known only server-side).
function roleSecret(): string {
  return (
    (process.env.ROLE_COOKIE_SECRET ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "fallback")
      .slice(0, 32)
      .padEnd(32, "x")
  );
}

// Lazily import and cache the HMAC CryptoKey on first call.
async function getRoleKey(): Promise<CryptoKey> {
  if (_roleKey === null) {
    _roleKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(roleSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
  }
  return _roleKey;
}

async function computeHmac(data: string): Promise<string> {
  const key = await getRoleKey();
  const buf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 24);
}

async function getCachedRole(req: NextRequest, userId: string): Promise<string | null> {
  const val = req.cookies.get(ROLE_COOKIE)?.value;
  if (!val) return null;
  const sep = val.lastIndexOf("|");
  if (sep < 1) return null;
  const role = val.slice(0, sep);
  const hmac = val.slice(sep + 1);
  const expected = await computeHmac(`${userId}|${role}`);
  return hmac === expected ? role : null;
}

async function setRoleCookie(res: NextResponse, userId: string, role: string): Promise<void> {
  const hmac = await computeHmac(`${userId}|${role}`);
  res.cookies.set(ROLE_COOKIE, `${role}|${hmac}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ROLE_TTL_SEC,
    path: "/",
  });
}

// ─── i18n config ──────────────────────────────────────────────────────────────

const LOCALES = ["es", "en"] as const;
const DEFAULT_LOCALE = "es";

const handleI18n = createMiddleware({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "as-needed", // default locale (es) has no prefix
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)"
  );
  return response;
}

/**
 * Returns the locale path prefix for redirect URLs.
 * Spanish (default) has no prefix; English uses /en.
 */
function getLocalePrefix(pathname: string): string {
  return pathname.startsWith("/en") ? "/en" : "";
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. API routes — rate limiting, no i18n needed ─────────────────────────
  if (pathname.startsWith("/api/")) {
    const ip = getClientIp(request);

    const limiter =
      pathname.startsWith("/api/auth/")
        ? authLimiter
        : pathname.startsWith("/api/conekta/")
          ? checkoutLimiter
          : pathname.startsWith("/api/leads")
            ? leadFormLimiter
            : apiLimiter;

    const result = await applyRateLimit(limiter, ip);

    if (!result.success) {
      return new NextResponse(
        JSON.stringify({ error: "Demasiadas solicitudes. Intenta más tarde." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": String(result.limit),
            "X-RateLimit-Remaining": "0",
            "Retry-After": "60",
          },
        }
      );
    }

    return withSecurityHeaders(NextResponse.next());
  }

  // ── 2. Run i18n middleware early — all page routes need it ─────────────────
  // We run it now so next-intl can detect locale from cookie/header and rewrite
  // the URL. Supabase's setAll callback will write session cookies directly onto
  // this response so we never lose httpOnly / SameSite options.
  const response = handleI18n(request);
  withSecurityHeaders(response);

  // ── 3. Protected route detection ──────────────────────────────────────────
  // Matches both /agent/... (es, default) and /en/agent/... (en).
  // /agent/auth is the login page itself — never protect it (would loop).
  const isAgentAuthRoute = /^\/(en\/)?agent\/auth(\/|$)/.test(pathname);
  const isAgentRoute = /^\/(en\/)?agent(\/|$)/.test(pathname) && !isAgentAuthRoute;
  const isAdminRoute = /^\/(en\/)?admin(\/|$)/.test(pathname);

  if (!isAgentRoute && !isAdminRoute) {
    return response;
  }

  // ── 4. Supabase auth check ────────────────────────────────────────────────
  // The createServerClient setAll callback mutates the already-created i18n
  // response directly, preserving all cookie attributes (httpOnly, Secure, etc.)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const prefix = getLocalePrefix(pathname);

  // No valid session — redirect to login
  if (!user) {
    const loginUrl = new URL(`${prefix}/agent/auth`, request.url);
    return withSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // Role: try the signed cookie first (cache hit → zero DB call).
  // On miss, query the DB and store the result for the next 5 minutes.
  let profileRole = await getCachedRole(request, user.id);
  if (!profileRole) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    profileRole = profile?.role ?? null;
    if (profileRole) await setRoleCookie(response, user.id, profileRole);
  }

  // Banned users are ejected from all agent routes
  if (isAgentRoute && profileRole === "banned") {
    const bannedUrl = new URL(`${prefix}/agent/auth?error=banned`, request.url);
    return withSecurityHeaders(NextResponse.redirect(bannedUrl));
  }

  // Admin routes require role === 'admin'
  if (isAdminRoute && profileRole !== "admin") {
    const homeUrl = new URL(`${prefix}/`, request.url);
    return withSecurityHeaders(NextResponse.redirect(homeUrl));
  }

  // Auth passed — inject the verified user ID as a request header so server
  // components can read it without a second round-trip to the Supabase auth server.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-user-id"); // strip any client-supplied value
  requestHeaders.set("x-user-id", user.id);
  const responseWithUserId = NextResponse.next({ request: { headers: requestHeaders } });

  // Copy all cookies (session refresh + role cookie) from the i18n response onto
  // the new response so nothing is lost.
  response.cookies.getAll().forEach(({ name, value, ...rest }) => {
    responseWithUserId.cookies.set(name, value, rest as Parameters<typeof responseWithUserId.cookies.set>[2]);
  });

  // Copy security headers from the i18n response.
  response.headers.forEach((value, key) => {
    if (key.startsWith("x-") || key === "content-security-policy" || key === "referrer-policy" || key === "permissions-policy") {
      responseWithUserId.headers.set(key, value);
    }
  });

  return withSecurityHeaders(responseWithUserId);
}

// ─── Matcher ──────────────────────────────────────────────────────────────────
// Runs on all paths except Next.js internals and static assets.
// API routes are included (they don't match any exclusion pattern).

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|eot)).*)",
  ],
};

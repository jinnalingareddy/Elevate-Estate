import { cache } from "react";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import type { User } from "@supabase/supabase-js";

// Memoized per-request — all callers within the same render share one instance.
export const getSupabaseServerClient = cache(() => {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — cookies can't be set; middleware handles refresh.
          }
        },
      },
    }
  );
});

// Cached per-request — calls getUser() at most once per render pass regardless
// of how many server components ask for the user. Eliminates the getSession()
// warning and avoids redundant network round-trips to the Supabase Auth server.
//
// Fast path: middleware injects x-user-id after verifying the session, so for
// all /agent/* and /admin/* routes no second network call is needed.
export const getAuthUser = cache(async (): Promise<User | null> => {
  const headerStore = await headers();
  const userId = headerStore.get("x-user-id");
  if (userId) {
    // Already verified by middleware — return a minimal User object.
    return { id: userId } as User;
  }
  // Fallback for public routes that optionally check auth (no middleware header).
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

// Stateless anon client — no cookies. Use inside unstable_cache callbacks and
// anywhere a user session is not needed (public read-only queries).
export function getSupabaseAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Uses createClient (not createServerClient) so the service role key is never
// overridden by a user session cookie, ensuring RLS is always bypassed.
export function getSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// Minimal profile shape — only the fields actually used across Navbar,
// AgentPreviewBar, and AgentEditButton.
export interface AuthProfile {
  id: string;
  role: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  agency_name: string | null;
  plan: string | null;
}

interface ClientAuthCtx {
  user: User | null;
  profile: AuthProfile | null;
  authLoading: boolean;
  signOut: () => Promise<void>;
}

const ClientAuthContext = createContext<ClientAuthCtx>({
  user: null,
  profile: null,
  authLoading: true,
  signOut: async () => {},
});

interface ClientAuthProviderProps {
  children: React.ReactNode;
  initialUser?: User | null;
}

export function ClientAuthProvider({ children, initialUser = null }: ClientAuthProviderProps) {
  // Seed state from the server-resolved user (passed via x-user-id header mechanism).
  // This avoids a redundant getUser() network call on mount for authenticated users.
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  // If we already have a user from the server, skip the loading state; still need
  // to fetch the profile, but we don't block renders with authLoading=true.
  const [authLoading, setAuthLoading] = useState(!initialUser);

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, role, full_name, avatar_url, email, agency_name, plan")
      .eq("id", userId)
      .single();
    setProfile((data as AuthProfile) ?? null);
  }, []);

  useEffect(() => {
    // If we had an initialUser, kick off profile fetch immediately.
    if (initialUser?.id) {
      fetchProfile(initialUser.id).finally(() => setAuthLoading(false));
    }

    const supabase = getSupabaseBrowserClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Access session.user only on client — safe because storage is localStorage here.
      // We call getUser() to get a validated user on auth state changes (login/logout).
      if (session) {
        supabase.auth.getUser().then(({ data: { user: u } }) => {
          setUser(u ?? null);
          if (u) fetchProfile(u.id);
          else { setProfile(null); setAuthLoading(false); }
        });
      } else {
        setUser(null);
        setProfile(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <ClientAuthContext.Provider value={{ user, profile, authLoading, signOut }}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  return useContext(ClientAuthContext);
}

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

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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
    const supabase = getSupabaseBrowserClient();

    // getSession() reads the JWT from localStorage — no network round-trip.
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchProfile(u.id).finally(() => setAuthLoading(false));
      } else {
        setAuthLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchProfile(u.id);
      } else {
        setProfile(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
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

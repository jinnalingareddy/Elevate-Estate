"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useClientAuth } from "@/components/providers/ClientAuthProvider";

interface FavoritesCtx {
  favorites: Set<string>;
  toggleFavorite: (listingId: string) => Promise<{ authed: boolean }>;
  isFavorited: (listingId: string) => boolean;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesCtx>({
  favorites: new Set(),
  toggleFavorite: async () => ({ authed: false }),
  isFavorited: () => false,
  loading: false,
});

const LS_KEY = "ee_favorites";

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  // loading is only true while the background API sync is in-flight,
  // but it no longer blocks page render — localStorage is shown immediately.
  const [loading, setLoading] = useState(false);
  const { user, authLoading } = useClientAuth();
  const synced = useRef(false);

  // Step 1: hydrate from localStorage synchronously on mount — zero delay.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setFavorites(new Set(JSON.parse(stored)));
    } catch {
      // ignore corrupt storage
    }
  }, []);

  // Step 2: once auth resolves, sync with the server in the background.
  // The page is already interactive at this point — this is a silent refresh.
  useEffect(() => {
    if (authLoading || synced.current) return;
    if (!user) return; // unauthenticated: localStorage is source of truth

    synced.current = true;
    setLoading(true);

    fetch("/api/favorites", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { favorites: [] }))
      .then(({ favorites: ids }: { favorites: string[] }) => {
        if (!Array.isArray(ids)) return;
        const next = new Set<string>(ids);
        setFavorites(next);
        localStorage.setItem(LS_KEY, JSON.stringify(Array.from(next)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const toggleFavorite = useCallback(
    async (listingId: string): Promise<{ authed: boolean }> => {
      // Optimistic update — UI responds instantly, no waiting for server.
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(listingId)) next.delete(listingId);
        else next.add(listingId);
        localStorage.setItem(LS_KEY, JSON.stringify(Array.from(next)));
        return next;
      });

      try {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId }),
        });

        if (res.status === 401) {
          // Revert optimistic update
          setFavorites((prev) => {
            const next = new Set(prev);
            if (next.has(listingId)) next.delete(listingId);
            else next.add(listingId);
            localStorage.setItem(LS_KEY, JSON.stringify(Array.from(next)));
            return next;
          });
          return { authed: false };
        }

        const data = await res.json();
        setFavorites((prev) => {
          const next = new Set(prev);
          if (data.favorited) next.add(listingId);
          else next.delete(listingId);
          localStorage.setItem(LS_KEY, JSON.stringify(Array.from(next)));
          return next;
        });
        return { authed: true };
      } catch {
        return { authed: true };
      }
    },
    []
  );

  const isFavorited = useCallback(
    (listingId: string) => favorites.has(listingId),
    [favorites]
  );

  return (
    <FavoritesContext.Provider
      value={{ favorites, toggleFavorite, isFavorited, loading }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}

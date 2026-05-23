"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  loading: true,
});

const LS_KEY = "ee_favorites";

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user, authLoading } = useClientAuth();

  // Load from localStorage immediately (no flash), then sync with API once auth resolves.
  // Unauthenticated users never hit the API — localStorage is the source of truth for them.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setFavorites(new Set(JSON.parse(stored)));
    } catch {
      // ignore
    }

    if (authLoading) return; // wait for auth state to resolve

    if (!user) {
      setLoading(false);
      return;
    }

    fetch("/api/favorites")
      .then((r) => (r.ok ? r.json() : { favorites: [] }))
      .then(({ favorites: ids }: { favorites: string[] }) => {
        if (Array.isArray(ids)) {
          const next = new Set<string>(ids);
          setFavorites(next);
          localStorage.setItem(LS_KEY, JSON.stringify(Array.from(next)));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const toggleFavorite = useCallback(
    async (listingId: string): Promise<{ authed: boolean }> => {
      // Optimistic update
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
        // Reconcile with server truth
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
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorited, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}

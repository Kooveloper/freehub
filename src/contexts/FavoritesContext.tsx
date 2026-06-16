'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useLoginPrompt } from '@/contexts/LoginPromptContext';
import { createClient } from '@/lib/supabase/client';

interface FavoritesContextValue {
  favorites: string[];
  isLoading: boolean;
  isLoggedIn: boolean;
  isFavorite: (toolId: string) => boolean;
  toggleFavorite: (toolId: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { showLoginPrompt } = useLoginPrompt();

  const fetchFavorites = useCallback(async () => {
    setIsLoading(true);

    try {
      const res = await fetch('/api/favorites', { credentials: 'same-origin' });

      if (res.status === 401) {
        setFavorites([]);
        setIsLoggedIn(false);
        return;
      }

      if (!res.ok) {
        throw new Error('즐겨찾기 조회 실패');
      }

      const data = await res.json();
      setFavorites(data.favorites ?? []);
    } catch (error) {
      console.error('즐겨찾기 조회 오류:', error);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncFromSession = useCallback(
    async (hasUser: boolean) => {
      setIsLoggedIn(hasUser);

      if (hasUser) {
        await fetchFavorites();
        return;
      }

      setFavorites([]);
      setIsLoading(false);
    },
    [fetchFavorites],
  );

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      void syncFromSession(Boolean(session?.user));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncFromSession(Boolean(session?.user));
    });

    return () => subscription.unsubscribe();
  }, [syncFromSession]);

  const toggleFavorite = useCallback(
    async (toolId: string) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showLoginPrompt();
        return;
      }

      setIsLoggedIn(true);

      const wasFavorite = favorites.includes(toolId);

      setFavorites((prev) =>
        wasFavorite
          ? prev.filter((id) => id !== toolId)
          : [...prev, toolId],
      );

      try {
        const res = await fetch('/api/favorites', {
          method: wasFavorite ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ toolId }),
        });

        if (res.status === 401) {
          setFavorites((prev) =>
            wasFavorite ? [...prev, toolId] : prev.filter((id) => id !== toolId),
          );
          setIsLoggedIn(false);
          showLoginPrompt();
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            typeof data.error === 'string'
              ? data.error
              : '즐겨찾기 변경 실패',
          );
        }
      } catch (error) {
        console.error('즐겨찾기 변경 오류:', error);
        setFavorites((prev) =>
          wasFavorite ? [...prev, toolId] : prev.filter((id) => id !== toolId),
        );
      }
    },
    [favorites, showLoginPrompt],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      isLoading,
      isLoggedIn,
      isFavorite: (toolId: string) => favorites.includes(toolId),
      toggleFavorite,
    }),
    [favorites, isLoading, isLoggedIn, toggleFavorite],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
}

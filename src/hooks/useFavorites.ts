'use client';

import { useCallback, useEffect, useState } from 'react';

import { useLoginPrompt } from '@/contexts/LoginPromptContext';
import { createClient } from '@/lib/supabase/client';

/** Supabase 즐겨찾기 목록 관리 훅 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { showLoginPrompt } = useLoginPrompt();

  const fetchFavorites = useCallback(async () => {
    setIsLoading(true);

    try {
      const res = await fetch('/api/favorites');

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
    } catch {
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncAuthAndFavorites = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    const loggedIn = Boolean(data.user);

    setIsLoggedIn(loggedIn);

    if (loggedIn) {
      await fetchFavorites();
      return;
    }

    setFavorites([]);
    setIsLoading(false);
  }, [fetchFavorites]);

  useEffect(() => {
    const supabase = createClient();

    void syncAuthAndFavorites();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void syncAuthAndFavorites();
    });

    return () => subscription.unsubscribe();
  }, [syncAuthAndFavorites]);

  const isFavorite = useCallback(
    (toolId: string) => favorites.includes(toolId),
    [favorites],
  );

  const toggleFavorite = useCallback(
    async (toolId: string) => {
      if (!isLoggedIn) {
        showLoginPrompt();
        return;
      }

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
          throw new Error('즐겨찾기 변경 실패');
        }
      } catch {
        setFavorites((prev) =>
          wasFavorite ? [...prev, toolId] : prev.filter((id) => id !== toolId),
        );
      }
    },
    [favorites, isLoggedIn, showLoginPrompt],
  );

  return {
    favorites,
    isLoading,
    isLoggedIn,
    isFavorite,
    toggleFavorite,
  };
}

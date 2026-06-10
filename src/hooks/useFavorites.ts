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
      setIsLoggedIn(true);
    } catch {
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        fetchFavorites();
      } else {
        setIsLoading(false);
        setIsLoggedIn(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchFavorites();
      } else {
        setFavorites([]);
        setIsLoggedIn(false);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchFavorites]);

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

      // 낙관적 업데이트
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
          showLoginPrompt();
          return;
        }

        if (!res.ok) {
          throw new Error('즐겨찾기 변경 실패');
        }
      } catch {
        // 실패 시 롤백
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
    isFavorite,
    toggleFavorite,
  };
}

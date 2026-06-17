'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { ToolCard } from '@/components/tools/ToolCard';
import { useLocale } from '@/contexts/LocaleContext';
import { useFavorites } from '@/hooks/useFavorites';
import type { Tool } from '@/types/tool';

interface FavoritesSectionProps {
  initialTools: Tool[];
}

export function FavoritesSection({ initialTools }: FavoritesSectionProps) {
  const { t } = useLocale();
  const { favorites, isLoading } = useFavorites();

  const favoriteTools = useMemo(() => {
    if (isLoading) return initialTools;

    const toolMap = new Map(initialTools.map((tool) => [tool.id, tool]));
    return favorites
      .map((id) => toolMap.get(id))
      .filter((tool): tool is Tool => tool != null);
  }, [initialTools, favorites, isLoading]);

  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900">{t('dashboard.favorites')}</h2>
      <p className="mt-1 text-sm text-gray-500">
        {t('dashboard.favoritesCount', { count: favoriteTools.length })}
      </p>

      {favoriteTools.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
          <p className="text-gray-600">{t('dashboard.favoritesEmpty')}</p>
          <Link
            href="/"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-6 text-base font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {t('dashboard.browseServices')}
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} favoriteIds={favorites} />
          ))}
        </div>
      )}
    </section>
  );
}

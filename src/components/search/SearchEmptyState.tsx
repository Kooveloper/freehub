'use client';

import { useMemo } from 'react';

import { ToolCard } from '@/components/tools/ToolCard';
import { CategoryCard } from '@/components/ui/CategoryCard';
import { useFavorites } from '@/hooks/useFavorites';
import { sortWithFavorites } from '@/lib/utils';
import type { Category, Tool } from '@/types/tool';

interface SearchEmptyStateProps {
  query: string;
  categories: Category[];
  popularTools: Tool[];
  categoryToolCounts: Record<string, number>;
}

/** 검색 결과 없음 — 추천 카테고리 + 인기 툴 */
export function SearchEmptyState({
  query,
  categories,
  popularTools,
  categoryToolCounts,
}: SearchEmptyStateProps) {
  const { favorites } = useFavorites();

  const sortedTools = useMemo(
    () => sortWithFavorites(popularTools, favorites),
    [popularTools, favorites],
  );

  return (
    <div className="space-y-10">
      <p className="text-center text-gray-500">
        &quot;{query}&quot;에 대한 검색 결과가 없습니다. 다른 키워드로
        검색하거나 카테고리에서 찾아보세요.
      </p>

      <section>
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          추천 카테고리
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {categories.slice(0, 6).map((category) => (
            <CategoryCard
              key={category.slug}
              category={category}
              toolCount={categoryToolCounts[category.slug] ?? 0}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-gray-900">인기 툴</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} favoriteIds={favorites} />
          ))}
        </div>
      </section>
    </div>
  );
}

'use client';

import { useMemo } from 'react';

import { ToolCard } from '@/components/tools/ToolCard';
import { useFavorites } from '@/hooks/useFavorites';
import { sortWithFavorites } from '@/lib/utils';
import type { Category, Tool } from '@/types/tool';

interface SearchResultsGridProps {
  tools: Tool[];
  categoryMap?: Record<string, Pick<Category, 'name' | 'icon'>>;
  subCategoryNameMap?: Record<string, string>;
}

/** 검색 결과 ToolCard 그리드 — 즐겨찾기 우선 정렬 */
export function SearchResultsGrid({
  tools,
  categoryMap = {},
  subCategoryNameMap = {},
}: SearchResultsGridProps) {
  const { favorites } = useFavorites();

  const sortedTools = useMemo(
    () => sortWithFavorites(tools, favorites),
    [tools, favorites],
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sortedTools.map((tool) => {
        const category = categoryMap[tool.category_slug];
        return (
          <ToolCard
            key={tool.id}
            tool={tool}
            favoriteIds={favorites}
            categoryName={category?.name}
            categoryIcon={category?.icon}
            subCategoryName={
              tool.sub_category
                ? subCategoryNameMap[tool.sub_category]
                : undefined
            }
          />
        );
      })}
    </div>
  );
}

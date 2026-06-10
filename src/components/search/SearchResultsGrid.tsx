'use client';

import { useMemo } from 'react';

import { ToolCard } from '@/components/tools/ToolCard';
import { useFavorites } from '@/hooks/useFavorites';
import { sortWithFavorites } from '@/lib/utils';
import type { Tool } from '@/types/tool';

interface SearchResultsGridProps {
  tools: Tool[];
}

/** 검색 결과 ToolCard 그리드 — 즐겨찾기 우선 정렬 */
export function SearchResultsGrid({ tools }: SearchResultsGridProps) {
  const { favorites } = useFavorites();

  const sortedTools = useMemo(
    () => sortWithFavorites(tools, favorites),
    [tools, favorites],
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sortedTools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} favoriteIds={favorites} />
      ))}
    </div>
  );
}

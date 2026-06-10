'use client';

import { Fragment, useMemo } from 'react';

import { AdInFeed } from '@/components/ads/AdInFeed';
import { ToolCard } from '@/components/tools/ToolCard';
import { useFavorites } from '@/hooks/useFavorites';
import { sortWithFavorites } from '@/lib/utils';
import type { Tool } from '@/types/tool';

interface EditorPicksSectionProps {
  tools: Tool[];
}

/** 에디터 픽 그리드 — 로그인 시 즐겨찾기 상단 정렬, 3번째 카드 뒤 인피드 광고 */
export function EditorPicksSection({ tools }: EditorPicksSectionProps) {
  const { favorites } = useFavorites();

  const sortedTools = useMemo(
    () => sortWithFavorites(tools, favorites),
    [tools, favorites],
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sortedTools.map((tool, index) => (
        <Fragment key={tool.id}>
          <ToolCard tool={tool} favoriteIds={favorites} />
          {index === 2 && (
            <AdInFeed className="sm:col-span-1" />
          )}
        </Fragment>
      ))}
    </div>
  );
}

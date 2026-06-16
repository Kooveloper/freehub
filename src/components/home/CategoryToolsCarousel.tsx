'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { ToolCard } from '@/components/tools/ToolCard';
import { cn } from '@/lib/utils';
import type { Tool } from '@/types/tool';

const TOOLS_PER_PAGE = 6;

interface CategoryToolsCarouselProps {
  tools: Tool[];
  categoryName: string;
  categoryIcon: string;
  subCategoryNameMap: Record<string, string>;
  favoriteIds: string[];
}

function chunkTools(tools: Tool[], size: number): Tool[][] {
  const pages: Tool[][] = [];
  for (let i = 0; i < tools.length; i += size) {
    pages.push(tools.slice(i, i + size));
  }
  return pages;
}

/** 카테고리 툴 목록 — 3열×2행(6개) 단위 페이지 + 좌우 이동·점 페이지네이션 */
export function CategoryToolsCarousel({
  tools,
  categoryName,
  categoryIcon,
  subCategoryNameMap,
  favoriteIds,
}: CategoryToolsCarouselProps) {
  const pages = useMemo(() => chunkTools(tools, TOOLS_PER_PAGE), [tools]);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    setPageIndex(0);
  }, [tools]);

  useEffect(() => {
    if (pageIndex > pages.length - 1) {
      setPageIndex(Math.max(0, pages.length - 1));
    }
  }, [pageIndex, pages.length]);

  const currentTools = pages[pageIndex] ?? [];
  const hasMultiplePages = pages.length > 1;

  const goPrev = () => setPageIndex((i) => Math.max(0, i - 1));
  const goNext = () =>
    setPageIndex((i) => Math.min(pages.length - 1, i + 1));

  return (
    <div className="relative">
      {hasMultiplePages && (
        <>
          <button
            type="button"
            onClick={goPrev}
            disabled={pageIndex === 0}
            aria-label="이전 툴"
            className="absolute -left-1 top-1/2 z-10 -translate-y-1/2 rounded-full border border-neutral-200 bg-white p-2 shadow-lg transition hover:border-neutral-300 hover:shadow-xl disabled:opacity-30 sm:-left-3 sm:p-2.5"
          >
            <ChevronLeft className="h-5 w-5 text-neutral-700" />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={pageIndex === pages.length - 1}
            aria-label="다음 툴"
            className="absolute -right-1 top-1/2 z-10 -translate-y-1/2 rounded-full border border-neutral-200 bg-white p-2 shadow-lg transition hover:border-neutral-300 hover:shadow-xl disabled:opacity-30 sm:-right-3 sm:p-2.5"
          >
            <ChevronRight className="h-5 w-5 text-neutral-700" />
          </button>
        </>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {currentTools.map((tool) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            categoryName={categoryName}
            categoryIcon={categoryIcon}
            subCategoryName={
              tool.sub_category
                ? subCategoryNameMap[tool.sub_category]
                : undefined
            }
            favoriteIds={favoriteIds}
          />
        ))}
      </div>

      {hasMultiplePages && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {pages.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`${index + 1}페이지`}
              aria-current={index === pageIndex ? 'true' : undefined}
              onClick={() => setPageIndex(index)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                index === pageIndex
                  ? 'w-7 bg-neutral-900'
                  : 'w-2 bg-neutral-300 hover:bg-neutral-400',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

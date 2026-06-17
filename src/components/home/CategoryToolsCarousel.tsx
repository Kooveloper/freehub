'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ToolCard } from '@/components/tools/ToolCard';
import { useDragScroll } from '@/hooks/useDragScroll';
import { cn } from '@/lib/utils';
import type { Tool } from '@/types/tool';

const DESKTOP_TOOLS_PER_PAGE = 6;
const MOBILE_TOOLS_PER_PAGE = 2;
const MOBILE_MEDIA_QUERY = '(max-width: 639px)';

interface CategoryToolsCarouselProps {
  tools: Tool[];
  categoryName: string;
  categoryIcon: string;
  subCategoryNameMap: Record<string, string>;
  favoriteIds: string[];
}

function chunkTools(items: Tool[], size: number): Tool[][] {
  const pages: Tool[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages;
}

function useToolsPerPage() {
  const [toolsPerPage, setToolsPerPage] = useState(DESKTOP_TOOLS_PER_PAGE);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_MEDIA_QUERY);
    const update = () => {
      setToolsPerPage(
        media.matches ? MOBILE_TOOLS_PER_PAGE : DESKTOP_TOOLS_PER_PAGE,
      );
    };

    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return toolsPerPage;
}

/** 카테고리 서비스 목록 — 모바일 1열×2행, 데스크톱 3열×2행 단위 슬라이드 */
export function CategoryToolsCarousel({
  tools,
  categoryName,
  categoryIcon,
  subCategoryNameMap,
  favoriteIds,
}: CategoryToolsCarouselProps) {
  const toolsPerPage = useToolsPerPage();
  const pages = useMemo(
    () => chunkTools(tools, toolsPerPage),
    [tools, toolsPerPage],
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const { ref: dragRef } = useDragScroll<HTMLDivElement>();
  const [activeIndex, setActiveIndex] = useState(0);
  const isProgrammaticScroll = useRef(false);

  const setScrollContainer = useCallback(
    (node: HTMLDivElement | null) => {
      scrollRef.current = node;
      dragRef.current = node;
    },
    [dragRef],
  );

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;

    const slides = Array.from(
      container.querySelectorAll('[data-slide]'),
    ) as HTMLElement[];
    const slide = slides[index];
    if (!slide) return;

    isProgrammaticScroll.current = true;
    container.scrollTo({
      left: slide.offsetLeft,
      behavior: 'smooth',
    });
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
    const container = scrollRef.current;
    if (container) {
      container.scrollTo({ left: 0, behavior: 'instant' });
    }
  }, [tools, toolsPerPage]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || pages.length <= 1) return;

    const slides = Array.from(
      container.querySelectorAll('[data-slide]'),
    ) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScroll.current) return;

        let bestIndex = -1;
        let bestRatio = 0;

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = index;
          }
        }

        if (bestIndex >= 0) {
          setActiveIndex(bestIndex);
        }
      },
      {
        root: container,
        threshold: [0.55, 0.65, 0.75, 0.85, 0.95],
      },
    );

    slides.forEach((slide) => observer.observe(slide));

    const handleScrollEnd = () => {
      isProgrammaticScroll.current = false;

      const center = container.scrollLeft + container.clientWidth / 2;
      let closest = 0;
      let minDist = Infinity;

      slides.forEach((slide, index) => {
        const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
        const dist = Math.abs(slideCenter - center);
        if (dist < minDist) {
          minDist = dist;
          closest = index;
        }
      });

      setActiveIndex(closest);
    };

    container.addEventListener('scrollend', handleScrollEnd);

    return () => {
      observer.disconnect();
      container.removeEventListener('scrollend', handleScrollEnd);
    };
  }, [pages.length]);

  const hasMultiplePages = pages.length > 1;

  const goPrev = () => scrollToIndex(Math.max(0, activeIndex - 1));
  const goNext = () =>
    scrollToIndex(Math.min(pages.length - 1, activeIndex + 1));

  return (
    <div className="relative">
      {hasMultiplePages && (
        <>
          <button
            type="button"
            onClick={goPrev}
            disabled={activeIndex === 0}
            aria-label="이전 서비스"
            className="absolute -left-1 top-[42%] z-10 -translate-y-1/2 rounded-full border border-neutral-200 bg-white p-2 shadow-lg transition hover:border-neutral-300 hover:shadow-xl disabled:opacity-30 sm:-left-3 sm:top-1/2 sm:p-2.5"
          >
            <ChevronLeft className="h-4 w-4 text-neutral-700 sm:h-5 sm:w-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={activeIndex === pages.length - 1}
            aria-label="다음 서비스"
            className="absolute -right-1 top-[42%] z-10 -translate-y-1/2 rounded-full border border-neutral-200 bg-white p-2 shadow-lg transition hover:border-neutral-300 hover:shadow-xl disabled:opacity-30 sm:-right-3 sm:top-1/2 sm:p-2.5"
          >
            <ChevronRight className="h-4 w-4 text-neutral-700 sm:h-5 sm:w-5" />
          </button>
        </>
      )}

      <div
        ref={setScrollContainer}
        className={cn(
          'scrollbar-hide flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain',
          'sm:cursor-grab sm:active:cursor-grabbing',
          hasMultiplePages && '-mx-1 px-1 sm:-mx-2 sm:px-2',
        )}
      >
        {pages.map((pageTools, slideIndex) => (
          <div
            key={slideIndex}
            data-slide
            data-index={slideIndex}
            className="w-full shrink-0 snap-center"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {pageTools.map((tool) => (
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
          </div>
        ))}
      </div>

      {hasMultiplePages && (
        <div className="mt-5 flex items-center justify-center gap-2 sm:mt-6">
          {pages.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`${index + 1}페이지`}
              aria-current={index === activeIndex ? 'true' : undefined}
              onClick={() => scrollToIndex(index)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                index === activeIndex
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

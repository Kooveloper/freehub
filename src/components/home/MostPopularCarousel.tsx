'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';

import { CategoryIcon } from '@/components/category/CategoryIcon';
import { ToolLogo } from '@/components/ui/ToolLogo';
import { cn } from '@/lib/utils';
import type { Category, Tool } from '@/types/tool';

export interface MostPopularEntry {
  category: Category;
  tools: Tool[];
}

interface MostPopularCarouselProps {
  title: string;
  subtitle: string;
  entries: MostPopularEntry[];
}

export function MostPopularCarousel({
  title,
  subtitle,
  entries,
}: MostPopularCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const visibleEntries = entries.filter((entry) => entry.tools.length > 0);

  const updateActiveIndex = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const slides = Array.from(
      container.querySelectorAll('[data-slide]'),
    ) as HTMLElement[];
    if (slides.length === 0) return;

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
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;

    const slides = Array.from(
      container.querySelectorAll('[data-slide]'),
    ) as HTMLElement[];
    const slide = slides[index];
    if (!slide) return;

    container.scrollTo({
      left: slide.offsetLeft - container.offsetLeft,
      behavior: 'smooth',
    });
    setActiveIndex(index);
  }, []);

  const goPrev = () => {
    scrollToIndex(Math.max(0, activeIndex - 1));
  };

  const goNext = () => {
    scrollToIndex(Math.min(visibleEntries.length - 1, activeIndex + 1));
  };

  if (visibleEntries.length === 0) return null;

  return (
    <section className="px-4 pb-2 pt-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-2 text-2xl font-bold text-black">{title}</h2>
        <p className="mb-6 text-sm text-neutral-500">{subtitle}</p>

        <div className="relative">
          {visibleEntries.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                disabled={activeIndex === 0}
                aria-label="이전 카테고리"
                className={cn(
                  'absolute left-0 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 rounded-full border border-neutral-200 bg-white p-2 shadow-md transition hover:bg-neutral-50 disabled:opacity-30 sm:flex',
                )}
              >
                <ChevronLeft className="h-5 w-5 text-neutral-700" />
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={activeIndex === visibleEntries.length - 1}
                aria-label="다음 카테고리"
                className={cn(
                  'absolute right-0 top-1/2 z-10 hidden translate-x-1/2 -translate-y-1/2 rounded-full border border-neutral-200 bg-white p-2 shadow-md transition hover:bg-neutral-50 disabled:opacity-30 sm:flex',
                )}
              >
                <ChevronRight className="h-5 w-5 text-neutral-700" />
              </button>
            </>
          )}

          <div
            ref={scrollRef}
            onScroll={updateActiveIndex}
            className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 pb-2 sm:-mx-6 sm:gap-5 sm:px-6 lg:-mx-8 lg:px-8"
          >
            {visibleEntries.map(({ category, tools }) => (
              <article
                key={category.slug}
                data-slide
                className="w-[min(100%,22rem)] shrink-0 snap-center sm:w-[24rem]"
              >
                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
                  <Link
                    href={`/category/${category.slug}`}
                    className="mb-5 flex items-center gap-2.5 transition-opacity hover:opacity-80"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-800">
                      <CategoryIcon name={category.icon} size={20} />
                    </span>
                    <h3 className="text-base font-bold text-neutral-900">
                      {category.name}
                    </h3>
                  </Link>

                  <ol className="divide-y divide-neutral-100">
                    {tools.slice(0, 5).map((tool, index) => (
                      <li key={tool.id}>
                        <Link
                          href={`/tool/${tool.slug}`}
                          className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                        >
                          <span
                            className={cn(
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                              index === 0
                                ? 'bg-black text-white'
                                : 'bg-neutral-100 text-neutral-700',
                            )}
                          >
                            {index + 1}
                          </span>
                          <ToolLogo
                            name={tool.name}
                            logoUrl={tool.logo_url}
                            size={40}
                            className="shrink-0 rounded-xl ring-1 ring-neutral-200 transition-all group-hover:ring-neutral-400"
                          />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-800 transition-colors group-hover:text-black">
                            {tool.name}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              </article>
            ))}
          </div>

          {visibleEntries.length > 1 && (
            <div className="mt-5 flex items-center justify-center gap-2">
              {visibleEntries.map((entry, index) => (
                <button
                  key={entry.category.slug}
                  type="button"
                  aria-label={`${entry.category.name} 보기`}
                  onClick={() => scrollToIndex(index)}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    index === activeIndex
                      ? 'w-6 bg-black'
                      : 'w-2 bg-neutral-300 hover:bg-neutral-400',
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

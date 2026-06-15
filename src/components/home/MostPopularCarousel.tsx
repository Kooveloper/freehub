'use client';

import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { CategoryIcon } from '@/components/category/CategoryIcon';
import { ToolLogo } from '@/components/ui/ToolLogo';
import { getCategoryColorHex } from '@/constants/category-colors';
import type { CategoryFeaturedEntry, RankChange } from '@/lib/featured-tools';
import { cn } from '@/lib/utils';

interface MostPopularCarouselProps {
  title: string;
  subtitle: string;
  entries: CategoryFeaturedEntry[];
}

function rankBadgeClass(rank: number): string {
  if (rank === 1) {
    return 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm shadow-amber-200';
  }
  if (rank === 2) {
    return 'bg-gradient-to-br from-neutral-300 to-neutral-400 text-white';
  }
  if (rank === 3) {
    return 'bg-gradient-to-br from-orange-300 to-orange-400 text-white';
  }
  return 'bg-neutral-100 text-neutral-600';
}

function RankChangeBadge({ change }: { change: RankChange }) {
  if (!change) return null;

  const isUp = change === 'up';

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        isUp
          ? 'bg-emerald-50 text-emerald-600'
          : 'bg-rose-50 text-rose-600',
      )}
      aria-label={isUp ? '순위 상승' : '순위 하락'}
    >
      {isUp ? (
        <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
      ) : (
        <TrendingDown className="h-3 w-3" strokeWidth={2.5} />
      )}
    </span>
  );
}

export function MostPopularCarousel({
  title,
  subtitle,
  entries,
}: MostPopularCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isProgrammaticScroll = useRef(false);

  const visibleEntries = entries.filter((entry) => entry.tools.length > 0);

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;

    const slides = Array.from(
      container.querySelectorAll('[data-slide]'),
    ) as HTMLElement[];
    const slide = slides[index];
    if (!slide) return;

    isProgrammaticScroll.current = true;
    const targetLeft =
      slide.offsetLeft - (container.clientWidth - slide.offsetWidth) / 2;

    container.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: 'smooth',
    });
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || visibleEntries.length === 0) return;

    const slides = Array.from(
      container.querySelectorAll('[data-slide]'),
    ) as HTMLElement[];

    const observer = new IntersectionObserver(
      (observerEntries) => {
        if (isProgrammaticScroll.current) return;

        let bestIndex = -1;
        let bestRatio = 0;

        for (const entry of observerEntries) {
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
  }, [visibleEntries.length]);

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
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            {title}
          </h2>
          <p className="mt-1.5 text-sm text-neutral-500">{subtitle}</p>
        </div>

        <div className="relative">
          {visibleEntries.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                disabled={activeIndex === 0}
                aria-label="이전 카테고리"
                className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-neutral-200 bg-white p-2.5 shadow-lg transition hover:border-neutral-300 hover:shadow-xl disabled:opacity-30 sm:flex"
              >
                <ChevronLeft className="h-5 w-5 text-neutral-700" />
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={activeIndex === visibleEntries.length - 1}
                aria-label="다음 카테고리"
                className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-neutral-200 bg-white p-2.5 shadow-lg transition hover:border-neutral-300 hover:shadow-xl disabled:opacity-30 sm:flex"
              >
                <ChevronRight className="h-5 w-5 text-neutral-700" />
              </button>
            </>
          )}

          <div
            ref={scrollRef}
            className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 pb-2 sm:-mx-6 sm:gap-5 sm:px-6 lg:-mx-8 lg:px-8"
          >
            {visibleEntries.map(({ category, tools }, slideIndex) => {
              const accentHex = getCategoryColorHex(category.color);

              return (
                <article
                  key={category.slug}
                  data-slide
                  data-index={slideIndex}
                  className="w-[min(100%,23rem)] shrink-0 snap-center sm:w-[25rem]"
                >
                  <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                    <div
                      className="h-1"
                      style={{ backgroundColor: accentHex }}
                      aria-hidden
                    />

                    <div className="p-5 sm:p-6">
                      <Link
                        href={`/category/${category.slug}`}
                        className="mb-5 flex items-center gap-3 transition-opacity hover:opacity-80"
                      >
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                          style={{ backgroundColor: accentHex }}
                        >
                          <CategoryIcon name={category.icon} size={20} />
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-bold text-neutral-900">
                            {category.name}
                          </h3>
                          <p className="text-xs font-medium text-neutral-400">
                            TOP {Math.min(tools.length, 5)}
                          </p>
                        </div>
                      </Link>

                      <ol className="space-y-1">
                        {tools.slice(0, 5).map(({ tool, rankChange }, index) => {
                          const rank = index + 1;

                          return (
                            <li key={tool.id}>
                              <Link
                                href={`/tool/${tool.slug}`}
                                className={cn(
                                  'group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors',
                                  rank === 1
                                    ? 'bg-amber-50/60 hover:bg-amber-50'
                                    : 'hover:bg-neutral-50',
                                )}
                              >
                                <span
                                  className={cn(
                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums',
                                    rankBadgeClass(rank),
                                  )}
                                >
                                  {rank}
                                </span>
                                <ToolLogo
                                  name={tool.name}
                                  logoUrl={tool.logo_url}
                                  size={42}
                                  className="shrink-0 rounded-xl ring-1 ring-neutral-200/80 transition-all group-hover:ring-neutral-300"
                                />
                                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-800 transition-colors group-hover:text-neutral-950">
                                  {tool.name}
                                </span>
                                <RankChangeBadge change={rankChange} />
                              </Link>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {visibleEntries.length > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              {visibleEntries.map((entry, index) => (
                <button
                  key={entry.category.slug}
                  type="button"
                  aria-label={`${entry.category.name} 보기`}
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
      </div>
    </section>
  );
}

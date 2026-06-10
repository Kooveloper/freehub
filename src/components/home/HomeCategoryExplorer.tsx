'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';

import { AdInFeed } from '@/components/ads/AdInFeed';
import { CategoryIcon } from '@/components/category/CategoryIcon';
import type { SortOption } from '@/components/tools/ToolFilter';
import { ToolFilterPanel } from '@/components/tools/ToolFilterPanel';
import { ToolCard } from '@/components/tools/ToolCard';
import { useLocale } from '@/contexts/LocaleContext';
import { useFavorites } from '@/hooks/useFavorites';
import {
  applyToolFilters,
  orderWithFavorites,
  sortTools,
} from '@/lib/tool-filters';
import { cn } from '@/lib/utils';
import type { Category, Tool } from '@/types/tool';

interface HomeCategoryExplorerProps {
  categories: Category[];
  variant?: 'light' | 'dark';
}

export function HomeCategoryExplorer({
  categories,
  variant = 'dark',
}: HomeCategoryExplorerProps) {
  const { locale, t } = useLocale();
  const { favorites } = useFavorites();
  const [activeSlug, setActiveSlug] = useState<string | null>(
    categories[0]?.slug ?? null,
  );
  const [toolsBySlug, setToolsBySlug] = useState<Record<string, Tool[]>>({});
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortOption>('popular');

  const isDark = variant === 'dark';

  const loadTools = useCallback(async (slug: string) => {
    setLoadingSlug(slug);
    try {
      const response = await fetch(`/api/categories/${slug}/tools`);
      if (!response.ok) throw new Error('load failed');
      const data = (await response.json()) as { tools: Tool[] };
      setToolsBySlug((prev) => ({ ...prev, [slug]: data.tools ?? [] }));
    } catch {
      setToolsBySlug((prev) => ({ ...prev, [slug]: [] }));
    } finally {
      setLoadingSlug(null);
    }
  }, []);

  useEffect(() => {
    if (!activeSlug || toolsBySlug[activeSlug]) return;
    loadTools(activeSlug);
  }, [activeSlug, toolsBySlug, loadTools]);

  const selectCategory = (slug: string) => {
    setActiveSlug(slug);
    setActiveFilters(new Set());
    setSort('popular');
  };

  const toggleFilter = (key: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const activeCategory = categories.find((c) => c.slug === activeSlug);
  const rawTools = activeSlug ? (toolsBySlug[activeSlug] ?? []) : [];

  const displayedTools = useMemo(() => {
    const filtered = applyToolFilters(rawTools, activeFilters);
    const sorted = sortTools(filtered, sort, locale);
    return orderWithFavorites(sorted, favorites);
  }, [rawTools, activeFilters, sort, locale, favorites]);

  if (categories.length === 0) return null;

  return (
    <div>
      <div className="scrollbar-hide -mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex min-w-max gap-3 sm:gap-4">
          {categories.map((category) => {
            const isSelected = activeSlug === category.slug;
            return (
              <button
                key={category.slug}
                type="button"
                onClick={() => selectCategory(category.slug)}
                className="flex w-[72px] shrink-0 flex-col items-center gap-2 sm:w-20"
              >
                <div
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-2xl border-2 transition-all sm:h-16 sm:w-16',
                    isDark
                      ? cn(
                          'bg-white/10 backdrop-blur-sm',
                          isSelected
                            ? 'border-white bg-white/20 shadow-lg shadow-black/20 ring-2 ring-white/30'
                            : 'border-white/20 hover:border-white/40 hover:bg-white/15',
                        )
                      : cn(
                          'bg-white shadow-sm',
                          isSelected
                            ? 'border-brand-500 bg-brand-50 shadow-md'
                            : 'border-transparent hover:border-gray-200 hover:bg-gray-50',
                        ),
                  )}
                  style={{ color: category.color }}
                >
                  <CategoryIcon
                    name={category.icon}
                    size={28}
                    className="sm:h-8 sm:w-8"
                  />
                </div>
                <span
                  className={cn(
                    'line-clamp-2 text-center text-xs font-bold leading-tight sm:text-sm',
                    isDark
                      ? isSelected
                        ? 'text-white'
                        : 'text-white/75'
                      : isSelected
                        ? 'text-brand-700'
                        : 'text-gray-700',
                  )}
                >
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {activeCategory && (
        <div
          className={cn(
            'mt-8 space-y-6',
            isDark &&
              'rounded-2xl border border-white/10 bg-white p-5 shadow-xl sm:p-6 lg:p-8',
          )}
        >
          <div>
            <h3
              className={cn(
                'text-lg font-bold sm:text-xl',
                isDark ? 'text-gray-900' : 'text-gray-900',
              )}
            >
              {activeCategory.name}
            </h3>
            <p
              className={cn(
                'mt-1 text-sm',
                isDark ? 'text-gray-500' : 'text-gray-500',
              )}
            >
              {activeCategory.description}
            </p>
          </div>

          <ToolFilterPanel
            activeFilters={activeFilters}
            sort={sort}
            onToggleFilter={toggleFilter}
            onSetSort={setSort}
            locale={locale}
          />

          {loadingSlug === activeSlug ? (
            <p className="py-12 text-center text-sm text-gray-400">
              {t('common.loading')}
            </p>
          ) : displayedTools.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">
              {t('common.noTools')}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayedTools.map((tool, index) => (
                <Fragment key={tool.id}>
                  <ToolCard
                    tool={tool}
                    categoryName={activeCategory.name}
                    favoriteIds={favorites}
                  />
                  {index === 2 && <AdInFeed className="sm:col-span-1" />}
                </Fragment>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

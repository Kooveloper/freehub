'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';

import { AdInFeed } from '@/components/ads/AdInFeed';
import { CategoryIcon } from '@/components/category/CategoryIcon';
import { CategoryBrowseToolbar } from '@/components/category/CategoryBrowseToolbar';
import { ToolCard } from '@/components/tools/ToolCard';
import type { SortOption } from '@/components/tools/tool-filter-options';
import { useLocale } from '@/contexts/LocaleContext';
import { useFavorites } from '@/hooks/useFavorites';
import { buildSubCategoryNameMap } from '@/lib/sub-categories';
import {
  applyToolFilters,
  orderWithFavorites,
  sortTools,
} from '@/lib/tool-filters';
import { cn } from '@/lib/utils';
import type { Category, SubCategory, Tool } from '@/types/tool';

interface HomeCategoryExplorerProps {
  categories: Category[];
  subByCategory: Record<string, SubCategory[]>;
  variant?: 'light' | 'dark';
}

export function HomeCategoryExplorer({
  categories,
  subByCategory,
  variant = 'dark',
}: HomeCategoryExplorerProps) {
  const { locale, t } = useLocale();
  const { favorites } = useFavorites();
  const [activeSlug, setActiveSlug] = useState<string | null>(
    categories[0]?.slug ?? null,
  );
  const [activeSubSlug, setActiveSubSlug] = useState<string | null>(null);
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
    setActiveSubSlug(null);
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

  const clearFilters = () => {
    setActiveFilters(new Set());
  };

  const activeCategory = categories.find((c) => c.slug === activeSlug);
  const activeSubCategories = activeSlug
    ? (subByCategory[activeSlug] ?? [])
    : [];
  const subCategoryNameMap = useMemo(
    () => buildSubCategoryNameMap(activeSubCategories),
    [activeSubCategories],
  );
  const rawTools = activeSlug ? (toolsBySlug[activeSlug] ?? []) : [];

  const displayedTools = useMemo(() => {
    const subFiltered = activeSubSlug
      ? rawTools.filter((tool) => tool.sub_category === activeSubSlug)
      : rawTools;
    const filtered = applyToolFilters(subFiltered, activeFilters);
    const sorted = sortTools(filtered, sort, locale);
    return orderWithFavorites(sorted, favorites);
  }, [rawTools, activeSubSlug, activeFilters, sort, locale, favorites]);

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
                          'border border-neutral-700 bg-neutral-900 text-white',
                          isSelected
                            ? 'border-white bg-white text-black shadow-lg'
                            : 'hover:border-neutral-500 hover:bg-neutral-800',
                        )
                      : cn(
                          'bg-white shadow-sm',
                          isSelected
                            ? 'border-brand-500 bg-brand-50 shadow-md'
                            : 'border-transparent hover:border-gray-200 hover:bg-gray-50',
                        ),
                  )}
                  style={
                    isDark
                      ? { color: isSelected ? '#000000' : '#ffffff' }
                      : { color: category.color }
                  }
                >
                  <CategoryIcon
                    name={category.icon}
                    size={28}
                    className="sm:h-8 sm:w-8"
                  />
                </div>
                <span
                  className={cn(
                    'line-clamp-2 text-center text-xs leading-tight sm:text-sm',
                    isDark
                      ? isSelected
                        ? 'font-extrabold text-white'
                        : 'font-medium text-neutral-400'
                      : isSelected
                        ? 'font-bold text-brand-700'
                        : 'font-medium text-gray-700',
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
            'mt-8 space-y-6 overflow-visible',
            isDark &&
              'rounded-xl border border-neutral-200 bg-white p-5 sm:p-6 lg:p-8',
          )}
        >
          <CategoryBrowseToolbar
            titleSlot={
              <h3 className="text-lg font-bold leading-tight text-gray-900 sm:text-xl">
                {activeCategory.name}
              </h3>
            }
            titleMeta={
              <p className="text-sm text-gray-500">
                {activeCategory.description}
              </p>
            }
            subCategories={activeSubCategories}
            activeSub={activeSubSlug}
            onSubSelect={setActiveSubSlug}
            categoryColor={activeCategory.color}
            allLabel={t('category.all')}
            activeFilters={activeFilters}
            sort={sort}
            onToggleFilter={toggleFilter}
            onClearFilters={clearFilters}
            onSetSort={setSort}
            locale={locale}
            subEdgeBleed="card"
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
                    categoryIcon={activeCategory.icon}
                    subCategoryName={
                      tool.sub_category
                        ? subCategoryNameMap[tool.sub_category]
                        : undefined
                    }
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

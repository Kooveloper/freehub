'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';

import { CategoryBrowseToolbar } from '@/components/category/CategoryBrowseToolbar';
import type { SortOption } from '@/components/tools/tool-filter-options';
import { useLocale } from '@/contexts/LocaleContext';
import type { SubCategory } from '@/types/tool';

interface CategoryPageToolbarProps {
  categoryColor: string;
  subCategories: SubCategory[];
  titleSlot?: React.ReactNode;
  titleMeta?: React.ReactNode;
  leadingSlot?: React.ReactNode;
  className?: string;
}

function parseFilters(param: string | null): Set<string> {
  if (!param) return new Set();
  return new Set(param.split(',').filter(Boolean));
}

export function CategoryPageToolbar({
  categoryColor,
  subCategories,
  titleSlot,
  titleMeta,
  leadingSlot,
  className,
}: CategoryPageToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale, t } = useLocale();
  const [isPending, startTransition] = useTransition();

  const activeSub = searchParams.get('sub');
  const activeFilters = parseFilters(searchParams.get('filter'));
  const sort = (searchParams.get('sort') as SortOption) || 'popular';

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      if ('filter' in updates || 'sort' in updates || 'sub' in updates) {
        params.delete('page');
      }

      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams],
  );

  const handleSubSelect = (subSlug: string | null) => {
    updateParams({ sub: subSlug });
  };

  const toggleFilter = (key: string) => {
    const next = new Set(activeFilters);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    updateParams({ filter: next.size > 0 ? Array.from(next).join(',') : null });
  };

  const clearFilters = () => {
    updateParams({ filter: null });
  };

  const setSort = (key: SortOption) => {
    updateParams({ sort: key === 'popular' ? null : key });
  };

  return (
    <CategoryBrowseToolbar
      subCategories={subCategories}
      activeSub={activeSub}
      onSubSelect={handleSubSelect}
      categoryColor={categoryColor}
      allLabel={t('category.all')}
      activeFilters={activeFilters}
      sort={sort}
      onToggleFilter={toggleFilter}
      onClearFilters={clearFilters}
      onSetSort={setSort}
      locale={locale}
      filterDisabled={isPending}
      titleSlot={titleSlot}
      titleMeta={titleMeta}
      leadingSlot={leadingSlot}
      className={className}
    />
  );
}

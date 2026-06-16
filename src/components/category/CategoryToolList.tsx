'use client';

import { Fragment, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { AdInFeed } from '@/components/ads/AdInFeed';
import { ToolCard } from '@/components/tools/ToolCard';
import type { SortOption } from '@/components/tools/tool-filter-options';
import { useFavorites } from '@/hooks/useFavorites';
import { toolInSubCategory } from '@/lib/tool-categories';
import { cn, formatFreeLimit } from '@/lib/utils';
import type { FreeLimitType, Tool } from '@/types/tool';

const PAGE_SIZE = 20;

const LIMIT_KEYS = new Set(['daily', 'monthly', 'unlimited']);

function parseFilters(param: string | null): Set<string> {
  if (!param) return new Set();
  return new Set(param.split(',').filter(Boolean));
}

function applyFilters(tools: Tool[], filters: Set<string>): Tool[] {
  const limitFilters = [...filters].filter((f) => LIMIT_KEYS.has(f));

  return tools.filter((tool) => {
    if (limitFilters.length > 0) {
      if (!limitFilters.includes(tool.free_limit_type as FreeLimitType)) {
        return false;
      }
    }

    return true;
  });
}

function sortTools(tools: Tool[], sort: SortOption): Tool[] {
  const copy = [...tools];

  switch (sort) {
    case 'updated':
      return copy.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    default:
      return copy.sort((a, b) => b.view_count - a.view_count);
  }
}

/** 즐겨찾기를 맨 앞으로, 나머지는 정렬 순서 유지 */
function orderWithFavorites(tools: Tool[], favoriteIds: string[]): Tool[] {
  const favoriteSet = new Set(favoriteIds);
  const toolMap = new Map(tools.map((t) => [t.id, t]));

  const favorites = favoriteIds
    .map((id) => toolMap.get(id))
    .filter((t): t is Tool => t != null);

  const others = tools.filter((t) => !favoriteSet.has(t.id));
  return [...favorites, ...others];
}

interface CategoryToolListProps {
  tools: Tool[];
  categorySlug: string;
  categoryName?: string;
  categoryIcon?: string;
  subCategoryNameMap?: Record<string, string>;
}

export function CategoryToolList({
  tools,
  categorySlug,
  categoryName,
  categoryIcon,
  subCategoryNameMap = {},
}: CategoryToolListProps) {
  const searchParams = useSearchParams();
  const { favorites } = useFavorites();

  const filters = parseFilters(searchParams.get('filter'));
  const sort = (searchParams.get('sort') as SortOption) || 'popular';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const activeSub = searchParams.get('sub');

  const processedTools = useMemo(() => {
    const subFiltered = activeSub
      ? tools.filter((tool) =>
          toolInSubCategory(tool, categorySlug, activeSub),
        )
      : tools;
    const filtered = applyFilters(subFiltered, filters);
    const sorted = sortTools(filtered, sort);
    return orderWithFavorites(sorted, favorites);
  }, [tools, activeSub, filters, sort, favorites]);

  const totalPages = Math.max(1, Math.ceil(processedTools.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageTools = processedTools.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const favoritesOnPage = pageTools.filter((t) => favorites.includes(t.id));
  const othersOnPage = pageTools.filter((t) => !favorites.includes(t.id));
  const showFavoriteSection =
    currentPage === 1 && favoritesOnPage.length > 0;

  if (processedTools.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
        <p className="text-gray-500">조건에 맞는 서비스가 없어요</p>
        <p className="mt-1 text-sm text-gray-400">
          필터를 변경하거나 다른 카테고리를 탐색해 보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showFavoriteSection && (
        <div>
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            ⭐ 내 즐겨찾기
          </h2>
          <ToolGrid
            tools={favoritesOnPage}
            favoriteIds={favorites}
            adOffset={0}
            categoryName={categoryName}
            categoryIcon={categoryIcon}
            subCategoryNameMap={subCategoryNameMap}
          />
        </div>
      )}

      {(othersOnPage.length > 0 || !showFavoriteSection) && (
        <div>
          {showFavoriteSection && othersOnPage.length > 0 && (
            <h2 className="mb-4 text-lg font-bold text-gray-900">전체 서비스</h2>
          )}
          <ToolGrid
            tools={showFavoriteSection ? othersOnPage : pageTools}
            favoriteIds={favorites}
            adOffset={showFavoriteSection ? favoritesOnPage.length : 0}
            categoryName={categoryName}
            categoryIcon={categoryIcon}
            subCategoryNameMap={subCategoryNameMap}
          />
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          categorySlug={categorySlug}
          searchParams={searchParams}
        />
      )}
    </div>
  );
}

function ToolGrid({
  tools,
  favoriteIds,
  adOffset,
  categoryName,
  categoryIcon,
  subCategoryNameMap,
}: {
  tools: Tool[];
  favoriteIds: string[];
  adOffset: number;
  categoryName?: string;
  categoryIcon?: string;
  subCategoryNameMap?: Record<string, string>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool, index) => (
        <Fragment key={tool.id}>
          <ToolCard
            tool={tool}
            favoriteIds={favoriteIds}
            categoryName={categoryName}
            categoryIcon={categoryIcon}
            subCategoryName={
              tool.sub_category
                ? subCategoryNameMap?.[tool.sub_category]
                : undefined
            }
          />
          {adOffset + index === 2 && (
            <AdInFeed />
          )}
        </Fragment>
      ))}
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  categorySlug,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  categorySlug: string;
  searchParams: ReturnType<typeof useSearchParams>;
}) {
  const buildHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(page));
    }
    const query = params.toString();
    return `/category/${categorySlug}${query ? `?${query}` : ''}`;
  };

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="페이지네이션">
      <PageLink
        href={buildHref(currentPage - 1)}
        disabled={currentPage <= 1}
        label="이전"
      />

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors',
            p === currentPage
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
          )}
        >
          {p}
        </Link>
      ))}

      <PageLink
        href={buildHref(currentPage + 1)}
        disabled={currentPage >= totalPages}
        label="다음"
      />
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  label,
}: {
  href: string;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return (
      <span className="rounded-lg px-3 py-1.5 text-sm text-gray-300">
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
    >
      {label}
    </Link>
  );
}

'use client';

import Link from 'next/link';

import { SubCategoryToggleGroup } from '@/components/category/SubCategoryToggleGroup';
import { ToolFilterBar } from '@/components/tools/ToolFilterBar';
import type { SortOption } from '@/components/tools/tool-filter-options';
import { cn } from '@/lib/utils';
import type { SubCategory } from '@/types/tool';

interface CategoryBrowseToolbarProps {
  subCategories: SubCategory[];
  activeSub: string | null;
  onSubSelect: (subSlug: string | null) => void;
  categoryColor: string;
  allLabel?: string;
  subVariant?: 'light' | 'dark';
  activeFilters: Set<string>;
  sort: SortOption;
  onToggleFilter: (key: string) => void;
  onClearFilters: () => void;
  onSetSort: (key: SortOption) => void;
  locale?: 'ko' | 'en';
  filterDisabled?: boolean;
  className?: string;
  subEdgeBleed?: 'page' | 'card' | 'none';
  /** 모바일에서 타이틀 옆에 필터/정렬 또는 전체보기 배치 */
  titleSlot?: React.ReactNode;
  /** 타이틀 아래 설명·메타 (모바일) */
  titleMeta?: React.ReactNode;
  /** 모바일 타이틀 행 왼쪽 (카테고리 아이콘 등) */
  leadingSlot?: React.ReactNode;
  /** 설정 시 전체보기 버튼 표시 + 필터/정렬을 한 행 아래로 */
  viewAllHref?: string;
  viewAllLabel?: string;
}

function ViewAllButton({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50',
        className,
      )}
    >
      {label}
    </Link>
  );
}

/** 서브카테고리 + 필터/정렬 — PC: 한 줄, 모바일: 타이틀 옆 필터 + 서브 스크롤 */
export function CategoryBrowseToolbar({
  subCategories,
  activeSub,
  onSubSelect,
  categoryColor,
  allLabel,
  subVariant = 'light',
  activeFilters,
  sort,
  onToggleFilter,
  onClearFilters,
  onSetSort,
  locale = 'ko',
  filterDisabled,
  className,
  subEdgeBleed = 'page',
  titleSlot,
  titleMeta,
  leadingSlot,
  viewAllHref,
  viewAllLabel = '전체보기',
}: CategoryBrowseToolbarProps) {
  const hasSubs = subCategories.length > 0;
  const useViewAllLayout = Boolean(viewAllHref);

  const filterBarProps = {
    activeFilters,
    sort,
    onToggleFilter,
    onClearFilters,
    onSetSort,
    locale,
    disabled: filterDisabled,
    filterMenuAlign: 'right' as const,
    compact: true,
  };

  return (
    <div className={cn('mb-6', className)}>
      {titleSlot && (
        <div className="mb-3 lg:hidden">
          <div className="flex items-start gap-3">
            {leadingSlot}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-1.5">
                <div className="min-w-0 flex-1 pt-0.5">{titleSlot}</div>
                {useViewAllLayout && viewAllHref ? (
                  <ViewAllButton href={viewAllHref} label={viewAllLabel} />
                ) : (
                  <ToolFilterBar
                    {...filterBarProps}
                    dense
                    className="shrink-0"
                  />
                )}
              </div>
              {titleMeta && <div className="mt-1">{titleMeta}</div>}
            </div>
          </div>
        </div>
      )}

      {useViewAllLayout && viewAllHref && (
        <>
          <div
            className={cn(
              'mb-3 flex justify-end',
              titleSlot ? 'hidden lg:flex' : 'flex',
            )}
          >
            <ViewAllButton href={viewAllHref} label={viewAllLabel} />
          </div>
          <div className="mb-3 flex justify-end">
            <ToolFilterBar {...filterBarProps} className="shrink-0" />
          </div>
        </>
      )}

      <div
        className={cn(
          'flex flex-col gap-3',
          !useViewAllLayout && 'lg:flex-row lg:items-center lg:gap-4',
        )}
      >
        {hasSubs && (
          <div className="min-w-0 lg:flex-1">
            <SubCategoryToggleGroup
              subCategories={subCategories}
              activeSub={activeSub}
              onSelect={onSubSelect}
              categoryColor={categoryColor}
              allLabel={allLabel}
              variant={subVariant}
              edgeBleed={subEdgeBleed}
            />
          </div>
        )}

        {!useViewAllLayout && (
          <ToolFilterBar
            {...filterBarProps}
            className={cn(
              'shrink-0',
              titleSlot ? 'hidden lg:flex' : 'flex',
              hasSubs ? 'lg:ml-auto' : 'ml-auto',
            )}
          />
        )}
      </div>
    </div>
  );
}

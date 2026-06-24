'use client';

import { getCategoryColorHex } from '@/constants/category-colors';
import { cn } from '@/lib/utils';
import type { SubCategory } from '@/types/tool';

interface SubCategoryToggleGroupProps {
  subCategories: SubCategory[];
  activeSub: string | null;
  onSelect: (subSlug: string | null) => void;
  categoryColor: string;
  allLabel?: string;
  variant?: 'light' | 'dark';
  className?: string;
  /** 모바일 가로 스크롤 시 좌우 패딩 상쇄 */
  edgeBleed?: 'page' | 'card' | 'none';
}

function edgeBleedClass(edgeBleed: 'page' | 'card' | 'none') {
  switch (edgeBleed) {
    case 'page':
      return '-mx-4 px-4 sm:mx-0 sm:px-0';
    case 'card':
      return '-mx-5 px-5 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0';
    default:
      return '';
  }
}

/** 서브카테고리 텍스트 pill 토글 (아이콘 없음) */
export function SubCategoryToggleGroup({
  subCategories,
  activeSub,
  onSelect,
  categoryColor,
  allLabel = '전체',
  variant = 'light',
  className,
  edgeBleed = 'page',
}: SubCategoryToggleGroupProps) {
  const accentHex = getCategoryColorHex(categoryColor);

  if (subCategories.length === 0) {
    return null;
  }

  const handleSelect = (subSlug: string | null) => {
    if (subSlug && activeSub === subSlug) {
      onSelect(null);
      return;
    }
    onSelect(subSlug);
  };

  return (
    <div
      className={cn(
        'scrollbar-hide min-w-0 overflow-x-auto overscroll-x-contain py-2',
        '[-webkit-overflow-scrolling:touch]',
        edgeBleedClass(edgeBleed),
        className,
      )}
    >
      <div className="flex w-max flex-nowrap items-center gap-2">
        <TogglePill
          active={!activeSub}
          accentHex={accentHex}
          variant={variant}
          onClick={() => handleSelect(null)}
        >
          {allLabel}
        </TogglePill>
        {subCategories.map((sub) => (
          <TogglePill
            key={sub.slug}
            active={activeSub === sub.slug}
            accentHex={accentHex}
            variant={variant}
            onClick={() => handleSelect(sub.slug)}
          >
            {sub.name}
          </TogglePill>
        ))}
      </div>
    </div>
  );
}

function TogglePill({
  active,
  accentHex,
  variant,
  onClick,
  children,
}: {
  active: boolean;
  accentHex: string;
  variant: 'light' | 'dark';
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
        active
          ? 'border-transparent text-white'
          : variant === 'dark'
            ? 'border-neutral-600 bg-neutral-800 text-neutral-300 hover:border-neutral-500 hover:text-white'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900',
      )}
      style={
        active
          ? {
              backgroundColor: accentHex,
              borderColor: accentHex,
            }
          : undefined
      }
    >
      {children}
    </button>
  );
}

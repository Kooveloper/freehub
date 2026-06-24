import Link from 'next/link';

import { CategoryIcon } from '@/components/category/CategoryIcon';
import { getCategoryColorHex } from '@/constants/category-colors';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/tool';

interface CategoryIconNavProps {
  categories: Category[];
  activeSlug: string;
  className?: string;
}

/** 카테고리 페이지 상단 — 다른 대카테고리로 이동 */
export function CategoryIconNav({
  categories,
  activeSlug,
  className,
}: CategoryIconNavProps) {
  if (categories.length === 0) return null;

  return (
    <div className={cn('-mx-4 mb-6 px-4 sm:mx-0 sm:px-0', className)}>
      <div className="scrollbar-hide flex gap-3 overflow-x-auto overscroll-x-contain pb-1 sm:flex-wrap sm:justify-center sm:gap-4 sm:overflow-visible">
        {categories.map((category) => {
          const isActive = category.slug === activeSlug;
          const colorHex = getCategoryColorHex(category.color);

          return (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="flex w-[72px] shrink-0 flex-col items-center gap-2 sm:w-20"
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-2xl border-2 bg-white shadow-sm transition-all sm:h-16 sm:w-16',
                  isActive
                    ? 'border-brand-500 bg-brand-50 shadow-md'
                    : 'border-transparent hover:border-gray-200 hover:bg-gray-50',
                )}
                style={{ color: colorHex }}
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
                  isActive
                    ? 'font-bold text-brand-700'
                    : 'font-medium text-gray-700',
                )}
              >
                {category.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

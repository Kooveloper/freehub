'use client';

import { useRouter } from 'next/navigation';

import { CategoryIcon } from '@/components/category/CategoryIcon';
import { useLocale } from '@/contexts/LocaleContext';
import { getCategoryColorHex } from '@/constants/category-colors';
import { cn } from '@/lib/utils';
import type { Category, SubCategory } from '@/types/tool';

interface CategoryCardProps {
  category: Pick<Category, 'slug' | 'name' | 'description' | 'icon' | 'color'>;
  toolCount: number;
  subCategories?: SubCategory[];
  className?: string;
}

export function CategoryCard({
  category,
  toolCount,
  subCategories = [],
  className,
}: CategoryCardProps) {
  const router = useRouter();
  const { t } = useLocale();
  const colorHex = getCategoryColorHex(category.color);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/category/${category.slug}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          router.push(`/category/${category.slug}`);
        }
      }}
      className={cn(
        'group flex cursor-pointer flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm shadow-brand-900/5 transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md',
        className,
      )}
    >
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-colors"
        style={{
          backgroundColor: `${colorHex}18`,
          color: colorHex,
        }}
      >
        <CategoryIcon name={category.icon} size={24} className="h-6 w-6" />
      </div>

      <h3 className="font-semibold text-gray-900 group-hover:text-brand-600">
        {category.name}
      </h3>
      <p className="mt-1 line-clamp-2 flex-1 text-sm text-gray-500">
        {category.description}
      </p>

      {subCategories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {subCategories.slice(0, 3).map((sub) => (
            <button
              key={sub.slug}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                router.push(`/category/${category.slug}?sub=${sub.slug}`);
              }}
              className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-white hover:text-gray-900"
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      <p
        className="mt-3 text-sm font-medium"
        style={{ color: colorHex }}
      >
        {t('tool.toolCount', { count: toolCount })}
      </p>
    </div>
  );
}

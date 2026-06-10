'use client';

import Link from 'next/link';

import { CategoryIcon } from '@/components/category/CategoryIcon';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/tool';

interface CategoryCardProps {
  category: Pick<Category, 'slug' | 'name' | 'description' | 'icon' | 'color'>;
  toolCount: number;
  className?: string;
}

export function CategoryCard({
  category,
  toolCount,
  className,
}: CategoryCardProps) {
  const { t } = useLocale();

  return (
    <Link
      href={`/category/${category.slug}`}
      className={cn(
        'group flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm shadow-brand-900/5 transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md',
        className,
      )}
    >
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-colors"
        style={{
          backgroundColor: `${category.color}18`,
          color: category.color,
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
      <p
        className="mt-3 text-sm font-medium"
        style={{ color: category.color }}
      >
        {t('tool.toolCount', { count: toolCount })}
      </p>
    </Link>
  );
}

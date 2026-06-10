import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { AdSlot } from '@/components/ads/AdSlot';
import { CategoryIcon } from '@/components/category/CategoryIcon';
import { CategoryToolsSection } from '@/components/category/CategoryToolsSection';
import { ToolFilter } from '@/components/tools/ToolFilter';
import { SkeletonCardGrid } from '@/components/ui/SkeletonCard';
import {
  getAllCategories,
  getCategoryBySlug,
  getCategoryToolCounts,
  getToolsByCategory,
} from '@/lib/supabase/queries';
import { localizeCategory } from '@/lib/i18n/content';
import { getLocale, getTranslations } from '@/lib/locale';

export const revalidate = 3600;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return { title: locale === 'en' ? 'Category not found' : '카테고리를 찾을 수 없습니다' };
  }

  const localized = localizeCategory(category, locale);
  const tools = await getToolsByCategory(slug);

  return {
    title:
      locale === 'en'
        ? `Free ${localized.name} Tools (${tools.length}) | FreeHub`
        : `무료 ${localized.name} 툴 ${tools.length}개 | FreeHub`,
    description: localized.description,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const localizedCategory = localizeCategory(category, locale);
  const t = await getTranslations();

  const categoryToolCounts = await getCategoryToolCounts();
  const toolCount = categoryToolCounts[slug] ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-start gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `${localizedCategory.color}18`,
            color: localizedCategory.color,
          }}
        >
          <CategoryIcon name={localizedCategory.icon} className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {localizedCategory.name}
          </h1>
          <p className="mt-1 text-gray-500">{localizedCategory.description}</p>
          <p
            className="mt-2 text-sm font-medium"
            style={{ color: localizedCategory.color }}
          >
            {t('tool.toolCount', { count: toolCount })}
          </p>
        </div>
      </div>

      <AdSlot slotKey="HOME_TOP" variant="banner" className="mb-8 w-full" />

      <div className="mb-6">
        <Suspense fallback={<FilterSkeleton />}>
          <ToolFilter />
        </Suspense>
      </div>

      <Suspense fallback={<SkeletonCardGrid count={6} />}>
        <CategoryToolsSection slug={slug} />
      </Suspense>
    </div>
  );
}

function FilterSkeleton() {
  return (
    <div className="h-32 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
  );
}

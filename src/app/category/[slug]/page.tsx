import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { AdSlot } from '@/components/ads/AdSlot';
import { CategoryIcon } from '@/components/category/CategoryIcon';
import { CategoryPageToolbar } from '@/components/category/CategoryPageToolbar';
import { CategoryToolsSection } from '@/components/category/CategoryToolsSection';
import { SkeletonCardGrid } from '@/components/ui/SkeletonCard';
import { getCategoryColorHex } from '@/constants/category-colors';
import { localizeCategory } from '@/lib/i18n/content';
import { getLocale, getTranslations } from '@/lib/locale';
import {
  getAllCategories,
  getCategoryBySlug,
  getCategoryToolCounts,
  getSubCategoriesByCategory,
  getToolsByCategory,
} from '@/lib/supabase/queries';

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
  const subCategories = await getSubCategoriesByCategory(slug);
  const categoryColorHex = getCategoryColorHex(localizedCategory.color);

  const categoryIconBox = (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14"
      style={{
        backgroundColor: `${categoryColorHex}18`,
        color: categoryColorHex,
      }}
    >
      <CategoryIcon name={localizedCategory.icon} className="h-6 w-6 sm:h-7 sm:w-7" />
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 hidden items-start gap-4 sm:mb-8 lg:flex">
        {categoryIconBox}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {localizedCategory.name}
          </h1>
          <p className="mt-1 text-gray-500">{localizedCategory.description}</p>
          <p
            className="mt-2 text-sm font-medium"
            style={{ color: categoryColorHex }}
          >
            {t('tool.toolCount', { count: toolCount })}
          </p>
        </div>
      </div>

      <AdSlot slotKey="HOME_TOP" variant="banner" className="mb-6 w-full sm:mb-8" />

      <Suspense fallback={<ToolbarSkeleton />}>
        <CategoryPageToolbar
          categoryColor={localizedCategory.color}
          subCategories={subCategories}
          leadingSlot={categoryIconBox}
          titleSlot={
            <h1 className="text-lg font-bold leading-tight text-gray-900">
              {localizedCategory.name}
            </h1>
          }
          titleMeta={
            <>
              <p className="text-sm text-gray-500">
                {localizedCategory.description}
              </p>
              <p
                className="mt-1.5 text-xs font-medium"
                style={{ color: categoryColorHex }}
              >
                {t('tool.toolCount', { count: toolCount })}
              </p>
            </>
          }
        />
      </Suspense>

      <Suspense fallback={<SkeletonCardGrid count={6} />}>
        <CategoryToolsSection slug={slug} category={localizedCategory} />
      </Suspense>
    </div>
  );
}

function ToolbarSkeleton() {
  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-start gap-3 lg:hidden">
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-gray-100" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between gap-2">
            <div className="h-6 w-32 animate-pulse rounded bg-gray-100" />
            <div className="h-8 w-28 animate-pulse rounded-lg bg-gray-100" />
          </div>
          <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
        </div>
      </div>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-8 w-14 shrink-0 animate-pulse rounded-full bg-gray-100"
          />
        ))}
      </div>
    </div>
  );
}

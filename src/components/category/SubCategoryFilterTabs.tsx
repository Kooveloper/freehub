'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { SubCategoryToggleGroup } from '@/components/category/SubCategoryToggleGroup';
import { useLocale } from '@/contexts/LocaleContext';
import type { SubCategory } from '@/types/tool';

interface SubCategoryFilterTabsProps {
  categoryColor: string;
  subCategories: SubCategory[];
}

export function SubCategoryFilterTabs({
  categoryColor,
  subCategories,
}: SubCategoryFilterTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const activeSub = searchParams.get('sub');

  const buildHref = (subSlug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (subSlug) {
      params.set('sub', subSlug);
    } else {
      params.delete('sub');
    }
    params.delete('page');
    const query = params.toString();
    return `${pathname}${query ? `?${query}` : ''}`;
  };

  const handleSelect = (subSlug: string | null) => {
    router.push(buildHref(subSlug), { scroll: false });
  };

  return (
    <SubCategoryToggleGroup
      subCategories={subCategories}
      activeSub={activeSub}
      onSelect={handleSelect}
      categoryColor={categoryColor}
      allLabel={t('category.all')}
      className="mb-6"
    />
  );
}

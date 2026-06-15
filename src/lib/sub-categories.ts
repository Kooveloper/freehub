import type { Locale } from '@/i18n/config';
import {
  localizeSubCategory,
  localizeSubCategories,
} from '@/lib/i18n/content';
import type { SubCategory } from '@/types/tool';

export { localizeSubCategories };

export function groupSubCategoriesByCategory(
  subCategories: SubCategory[],
): Record<string, SubCategory[]> {
  const map: Record<string, SubCategory[]> = {};

  for (const sub of subCategories) {
    if (!map[sub.category_slug]) {
      map[sub.category_slug] = [];
    }
    map[sub.category_slug].push(sub);
  }

  for (const slug of Object.keys(map)) {
    map[slug].sort((a, b) => a.sort_order - b.sort_order);
  }

  return map;
}

export function buildSubCategoryNameMap(
  subCategories: SubCategory[],
  locale: Locale = 'ko',
): Record<string, string> {
  return Object.fromEntries(
    subCategories.map((sub) => [
      sub.slug,
      localizeSubCategory(sub, locale).name,
    ]),
  );
}

export function previewSubCategories(
  subCategories: SubCategory[],
  limit = 3,
): SubCategory[] {
  return [...subCategories]
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, limit);
}

import type { SubCategory } from '@/types/tool';

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
): Record<string, string> {
  return Object.fromEntries(subCategories.map((sub) => [sub.slug, sub.name]));
}

export function previewSubCategories(
  subCategories: SubCategory[],
  limit = 3,
): SubCategory[] {
  return [...subCategories]
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, limit);
}

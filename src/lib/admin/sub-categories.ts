import { SLUG_PATTERN } from '@/lib/admin/categories';

export interface SubCategoryFormInput {
  slug: string;
  name: string;
  category_slug: string;
  sort_order: number;
  is_active: boolean;
}

export function validateSubCategoryInput(
  body: unknown,
  options?: { slugRequired?: boolean },
): SubCategoryFormInput | null {
  if (!body || typeof body !== 'object') return null;

  const input = body as Record<string, unknown>;
  const slug = String(input.slug ?? '').trim();
  const name = String(input.name ?? '').trim();
  const categorySlug = String(input.category_slug ?? '').trim();
  const sortOrder = Number(input.sort_order);
  const isActive =
    input.is_active === undefined ? true : Boolean(input.is_active);

  if (options?.slugRequired !== false) {
    if (!slug || !SLUG_PATTERN.test(slug)) return null;
  }

  if (!name || name.length > 50) return null;
  if (!categorySlug) return null;
  if (!Number.isInteger(sortOrder) || sortOrder < 0) return null;

  return {
    slug,
    name,
    category_slug: categorySlug,
    sort_order: sortOrder,
    is_active: isActive,
  };
}

export function validateSubCategoryPatch(body: unknown): {
  name: string;
  sort_order: number;
  is_active: boolean;
} | null {
  if (!body || typeof body !== 'object') return null;

  const input = body as Record<string, unknown>;
  const name = String(input.name ?? '').trim();
  const sortOrder = Number(input.sort_order);
  const isActive =
    input.is_active === undefined ? true : Boolean(input.is_active);

  if (!name || name.length > 50) return null;
  if (!Number.isInteger(sortOrder) || sortOrder < 0) return null;

  return {
    name,
    sort_order: sortOrder,
    is_active: isActive,
  };
}

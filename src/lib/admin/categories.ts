import type { SupabaseClient } from '@supabase/supabase-js';

import {
  CATEGORY_COLOR_VALUES,
  type CategoryColor,
} from '@/constants/category-colors';
import { isValidCategoryIcon } from '@/lib/category-icon';

export const SLUG_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export interface CategoryFormInput {
  slug: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  icon: string;
  color: CategoryColor;
  sort_order: number;
}

export function validateCategoryInput(
  body: unknown,
  options?: { slugRequired?: boolean },
): CategoryFormInput | null {
  if (!body || typeof body !== 'object') return null;

  const input = body as Record<string, unknown>;
  const slug = String(input.slug ?? '').trim();
  const name = String(input.name ?? '').trim();
  const nameEn = String(input.name_en ?? '').trim();
  const description = String(input.description ?? '').trim();
  const descriptionEn = String(input.description_en ?? '').trim();
  const icon = String(input.icon ?? '').trim();
  const color = String(input.color ?? '').trim();
  const sortOrder = Number(input.sort_order);

  if (options?.slugRequired !== false) {
    if (!slug || !SLUG_PATTERN.test(slug)) return null;
  }

  if (!name || name.length > 50) return null;
  if (nameEn.length > 50) return null;
  if (!description || description.length > 200) return null;
  if (descriptionEn.length > 200) return null;
  if (!isValidCategoryIcon(icon)) return null;
  if (!CATEGORY_COLOR_VALUES.includes(color as CategoryColor)) return null;
  if (!Number.isInteger(sortOrder) || sortOrder < 0) return null;

  return {
    slug,
    name,
    name_en: nameEn,
    description,
    description_en: descriptionEn,
    icon,
    color: color as CategoryColor,
    sort_order: sortOrder,
  };
}

export async function getToolCountByCategorySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('tools')
    .select('*', { count: 'exact', head: true })
    .eq('category_slug', slug);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function swapCategoryOrder(
  supabase: SupabaseClient,
  id: string,
  direction: 'up' | 'down',
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, sort_order')
    .order('sort_order', { ascending: true });

  if (error) {
    return { ok: false, error: error.message };
  }

  const list = categories ?? [];
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) {
    return { ok: false, error: '카테고리를 찾을 수 없습니다.' };
  }

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= list.length) {
    return { ok: true };
  }

  const current = list[index];
  const target = list[targetIndex];

  const [updateCurrent, updateTarget] = await Promise.all([
    supabase
      .from('categories')
      .update({ sort_order: target.sort_order })
      .eq('id', current.id),
    supabase
      .from('categories')
      .update({ sort_order: current.sort_order })
      .eq('id', target.id),
  ]);

  if (updateCurrent.error || updateTarget.error) {
    return {
      ok: false,
      error:
        updateCurrent.error?.message ??
        updateTarget.error?.message ??
        '순서 변경 실패',
    };
  }

  return { ok: true };
}

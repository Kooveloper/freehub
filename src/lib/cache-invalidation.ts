import { revalidatePath } from 'next/cache';

import { redis } from '@/lib/redis';

const CATEGORIES_CACHE_KEY = 'categories:all';
const SUB_CATEGORIES_CACHE_KEY = 'sub_categories:all';

function categoryToolsCacheKey(slug: string) {
  return `tools:category:${slug}`;
}

/** 공개 페이지 Redis 캐시 + ISR 무효화 */
export async function invalidatePublicCache(options?: {
  categorySlugs?: string[];
  toolSlug?: string;
}) {
  try {
    await redis.del(CATEGORIES_CACHE_KEY);
    await redis.del(SUB_CATEGORIES_CACHE_KEY);
    for (const slug of options?.categorySlugs ?? []) {
      if (slug) {
        await redis.del(categoryToolsCacheKey(slug));
      }
    }
  } catch {
    // Redis 장애 시 revalidate만 수행
  }

  revalidatePath('/');
  revalidatePath('/search');
  revalidatePath('/sitemap.xml');
  revalidatePath('/admin/categories');

  for (const slug of options?.categorySlugs ?? []) {
    if (slug) {
      revalidatePath(`/category/${slug}`);
    }
  }

  if (options?.toolSlug) {
    revalidatePath(`/tool/${options.toolSlug}`);
  }
}

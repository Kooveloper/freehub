import { redis } from '@/lib/redis';
import { createStaticClient } from '@/lib/supabase/server';
import type { LegalPage, LegalPageSlug } from '@/types/legal-page';

const CACHE_PREFIX = 'legal:';

function cacheKey(slug: LegalPageSlug) {
  return `${CACHE_PREFIX}${slug}`;
}

export async function getLegalPage(slug: LegalPageSlug): Promise<LegalPage | null> {
  try {
    const cached = await redis.get<LegalPage>(cacheKey(slug));
    if (cached) return cached;
  } catch {
    // ignore
  }

  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from('legal_pages')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) return null;

  const page = data as LegalPage;

  try {
    await redis.set(cacheKey(slug), page, { ex: 300 });
  } catch {
    // ignore
  }

  return page;
}

export async function invalidateLegalPageCache(slug: LegalPageSlug) {
  try {
    await redis.del(cacheKey(slug));
  } catch {
    // ignore
  }
}

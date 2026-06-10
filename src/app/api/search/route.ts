import { NextResponse } from 'next/server';

import { localizeTools } from '@/lib/i18n/content';
import { getLocale } from '@/lib/locale';
import { redis } from '@/lib/redis';
import { searchTools } from '@/lib/supabase/queries';
import type { Tool } from '@/types/tool';

const CACHE_TTL_SECONDS = 300;

function buildCacheKey(q: string, category: string, limit: string) {
  return `search:${q.toLowerCase()}:${category}:${limit}`;
}

/** GET /api/search?q=&category=&limit= */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const category = searchParams.get('category')?.trim() ?? '';
  const limitParam = searchParams.get('limit');
  const limit =
    limitParam != null && limitParam !== ''
      ? Math.min(Math.max(parseInt(limitParam, 10) || 0, 1), 100)
      : undefined;

  if (!q) {
    return NextResponse.json({ tools: [], total: 0 });
  }

  const cacheKey = buildCacheKey(q, category, limitParam ?? '');

  try {
    const cached = await redis.get<{ tools: Tool[]; total: number }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }
  } catch (error) {
    console.error('검색 캐시 조회 실패:', error);
  }

  const result = await searchTools(q, {
    category: category || undefined,
    limit,
  });

  const locale = await getLocale();
  const localized = {
    tools: localizeTools(result.tools, locale),
    total: result.total,
  };

  try {
    await redis.set(cacheKey, localized, { ex: CACHE_TTL_SECONDS });
  } catch (error) {
    console.error('검색 캐시 저장 실패:', error);
  }

  return NextResponse.json(localized);
}

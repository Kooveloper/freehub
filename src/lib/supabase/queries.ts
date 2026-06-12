import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { redis } from '@/lib/redis';
import type { Category, SubCategory, Tool } from '@/types/tool';

import { createClient, createStaticClient } from './server';

const CATEGORIES_CACHE_KEY = 'categories:all';
const SUB_CATEGORIES_CACHE_KEY = 'sub_categories:all';
const CATEGORIES_CACHE_TTL = 3600;
const CATEGORY_TOOLS_CACHE_TTL = 600;

function categoryToolsCacheKey(slug: string) {
  return `tools:category:${slug}`;
}

async function getCached<T>(key: string): Promise<T | null> {
  try {
    return await redis.get<T>(key);
  } catch {
    return null;
  }
}

async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // Redis 장애 시 DB 결과만 반환
  }
}

/** 서비스 롤 키로 관리 작업용 클라이언트 생성 (조회수 증가 등) */
function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/** 전체 도구 목록 조회 (조회수 내림차순) */
export async function getAllTools(): Promise<Tool[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .order('view_count', { ascending: false });

  if (error) {
    throw new Error(`도구 목록 조회 실패: ${error.message}`);
  }

  return (data ?? []) as Tool[];
}

/** slug로 단일 도구 조회 */
export async function getToolBySlug(slug: string): Promise<Tool> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    throw new Error(`도구를 찾을 수 없습니다: ${slug}`);
  }

  return data as Tool;
}

/** SSG용 전체 툴 slug 목록 */
export async function getAllToolSlugs(): Promise<string[]> {
  const supabase = createStaticClient();

  const { data, error } = await supabase.from('tools').select('slug');

  if (error) {
    throw new Error(`툴 slug 조회 실패: ${error.message}`);
  }

  return (data ?? []).map((row) => row.slug as string);
}

/** 같은 카테고리 관련 툴 (현재 툴 제외) */
export async function getRelatedTools(
  categorySlug: string,
  excludeId: string,
  limit = 3,
): Promise<Tool[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .eq('category_slug', categorySlug)
    .neq('id', excludeId)
    .order('view_count', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`관련 툴 조회 실패: ${error.message}`);
  }

  return (data ?? []) as Tool[];
}

/** 제보 폼 툴 선택용 (이름순) */
export async function getToolOptions(): Promise<{ id: string; name: string }[]> {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from('tools')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`툴 목록 조회 실패: ${error.message}`);
  }

  return data ?? [];
}

/** slug 목록으로 도구 조회 (요청 순서 유지) */
export async function getToolsBySlugs(slugs: string[]): Promise<Tool[]> {
  const uniqueSlugs = [...new Set(slugs.map((slug) => slug.trim()).filter(Boolean))];
  if (uniqueSlugs.length === 0) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .in('slug', uniqueSlugs);

  if (error) {
    throw new Error(`도구 조회 실패: ${error.message}`);
  }

  const toolMap = new Map(
    ((data ?? []) as Tool[]).map((tool) => [tool.slug, tool]),
  );

  return slugs
    .map((slug) => toolMap.get(slug))
    .filter((tool): tool is Tool => tool != null);
}

/** 유저 즐겨찾기 툴 목록 (favorites JOIN tools, 추가 순) */
export async function getFavoriteToolsForUser(userId: string): Promise<Tool[]> {
  const supabase = await createClient();

  const { data: favRows, error: favError } = await supabase
    .from('favorites')
    .select('tool_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (favError) {
    throw new Error(`즐겨찾기 조회 실패: ${favError.message}`);
  }

  if (!favRows?.length) {
    return [];
  }

  const toolIds = favRows.map((row) => row.tool_id as string);

  const { data: tools, error: toolsError } = await supabase
    .from('tools')
    .select('*')
    .in('id', toolIds);

  if (toolsError) {
    throw new Error(`즐겨찾기 툴 조회 실패: ${toolsError.message}`);
  }

  const toolMap = new Map((tools ?? []).map((tool) => [tool.id as string, tool as Tool]));
  return toolIds
    .map((id) => toolMap.get(id))
    .filter((tool): tool is Tool => tool != null);
}

/** 카테고리별 도구 목록 조회 (Redis 10분 캐시) */
export async function getToolsByCategory(categorySlug: string): Promise<Tool[]> {
  const cacheKey = categoryToolsCacheKey(categorySlug);
  const cached = await getCached<Tool[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .eq('category_slug', categorySlug)
    .order('view_count', { ascending: false });

  if (error) {
    throw new Error(`카테고리 도구 조회 실패: ${error.message}`);
  }

  const tools = (data ?? []) as Tool[];
  await setCached(cacheKey, tools, CATEGORY_TOOLS_CACHE_TTL);
  return tools;
}

/** 이름·설명·태그 기준 도구 검색 */
export async function searchTools(
  query: string,
  options?: { category?: string; limit?: number },
): Promise<{ tools: Tool[]; total: number }> {
  const supabase = createStaticClient();
  const trimmed = query.trim();

  if (!trimmed) {
    return { tools: [], total: 0 };
  }

  const pattern = `%${trimmed}%`;

  let builder = supabase
    .from('tools')
    .select('*', { count: 'exact' })
    .or(
      `name.ilike.${pattern},description.ilike.${pattern},name_en.ilike.${pattern},description_en.ilike.${pattern},tags.cs.{${trimmed}}`,
    )
    .order('view_count', { ascending: false });

  if (options?.category) {
    builder = builder.eq('category_slug', options.category);
  }

  if (options?.limit != null) {
    builder = builder.limit(options.limit);
  }

  const { data, error, count } = await builder;

  if (error) {
    throw new Error(`도구 검색 실패: ${error.message}`);
  }

  return {
    tools: (data ?? []) as Tool[],
    total: count ?? 0,
  };
}

/** 활성 카테고리 목록 조회 (sort_order 오름차순, Redis 1시간 캐시) */
export async function getAllCategories(): Promise<Category[]> {
  const cached = await getCached<Category[]>(CATEGORIES_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`카테고리 조회 실패: ${error.message}`);
  }

  const categories = (data ?? []) as Category[];
  await setCached(CATEGORIES_CACHE_KEY, categories, CATEGORIES_CACHE_TTL);
  return categories;
}

/** slug로 단일 카테고리 조회 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Category;
}

/** 에디터 픽 — 검증된 툴, 조회수 상위 N개 */
export async function getEditorPicks(limit = 6): Promise<Tool[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .eq('is_verified', true)
    .order('view_count', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`에디터 픽 조회 실패: ${error.message}`);
  }

  return (data ?? []) as Tool[];
}

/** 전체 툴 개수 */
export async function getToolCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('tools')
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(`툴 개수 조회 실패: ${error.message}`);
  }

  return count ?? 0;
}

/** 카테고리별 툴 개수 (category_slug → count) */
export async function getCategoryToolCounts(): Promise<Record<string, number>> {
  const supabase = await createClient();

  const { data, error } = await supabase.from('tools').select('category_slug');

  if (error) {
    throw new Error(`카테고리별 툴 수 조회 실패: ${error.message}`);
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const slug = row.category_slug as string;
    counts[slug] = (counts[slug] ?? 0) + 1;
  }

  return counts;
}

/**
 * 도구 조회수 1 증가
 * DB에 increment_tool_view_count RPC가 있으면 사용하고, 없으면 직접 업데이트합니다.
 */
export async function incrementViewCount(toolId: string): Promise<void> {
  const supabase = createServiceClient();

  const { error: rpcError } = await supabase.rpc('increment_tool_view_count', {
    p_tool_id: toolId,
  });

  if (!rpcError) {
    return;
  }

  // RPC 미설정 시 폴백: 현재 값 조회 후 +1
  const { data, error: fetchError } = await supabase
    .from('tools')
    .select('view_count')
    .eq('id', toolId)
    .single();

  if (fetchError || !data) {
    console.error('조회수 증가 실패:', fetchError?.message ?? '도구 없음');
    return;
  }

  const { error: updateError } = await supabase
    .from('tools')
    .update({ view_count: data.view_count + 1 })
    .eq('id', toolId);

  if (updateError) {
    console.error('조회수 업데이트 실패:', updateError.message);
  }
}

/** 활성 서브카테고리 전체 목록 (sort_order 오름차순, Redis 1시간 캐시) */
export async function getAllSubCategories(): Promise<SubCategory[]> {
  const cached = await getCached<SubCategory[]>(SUB_CATEGORIES_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from('sub_categories')
    .select('*')
    .eq('is_active', true)
    .order('category_slug', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`서브카테고리 조회 실패: ${error.message}`);
  }

  const subCategories = (data ?? []) as SubCategory[];
  await setCached(
    SUB_CATEGORIES_CACHE_KEY,
    subCategories,
    CATEGORIES_CACHE_TTL,
  );
  return subCategories;
}

/** 대카테고리별 활성 서브카테고리 목록 */
export async function getSubCategoriesByCategory(
  categorySlug: string,
): Promise<SubCategory[]> {
  const all = await getAllSubCategories();
  return all.filter((sub) => sub.category_slug === categorySlug);
}

/** 서브카테고리 slug로 툴 목록 조회 */
export async function getToolsBySubCategory(subSlug: string): Promise<Tool[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .eq('sub_category', subSlug)
    .order('view_count', { ascending: false });

  if (error) {
    throw new Error(`서브카테고리 도구 조회 실패: ${error.message}`);
  }

  return (data ?? []) as Tool[];
}

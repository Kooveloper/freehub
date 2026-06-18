import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import {
  resolveAnalyticsRange,
  type AnalyticsDateRange,
  type AnalyticsPeriod,
} from '@/lib/admin/analytics';

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export interface FavoriteSummary {
  total: number;
  uniqueUsers: number;
  uniqueTools: number;
  range: AnalyticsDateRange;
}

export interface CategoryFavoriteStat {
  category_slug: string;
  category_name: string;
  favorite_count: number;
}

export interface SubCategoryFavoriteStat {
  sub_category_slug: string;
  sub_category_name: string;
  category_slug: string;
  category_name: string;
  favorite_count: number;
}

export interface ToolFavoriteStat {
  tool_id: string;
  tool_slug: string;
  tool_name: string;
  category_slug: string;
  category_name: string;
  sub_category: string | null;
  sub_category_name: string | null;
  favorite_count: number;
}

export interface AdminFavoriteAnalyticsData {
  summary: FavoriteSummary;
  categories: CategoryFavoriteStat[];
  subCategories: SubCategoryFavoriteStat[];
  tools: ToolFavoriteStat[];
}

export async function getAdminFavoriteAnalytics(
  period: AnalyticsPeriod,
  fromParam?: string | null,
  toParam?: string | null,
): Promise<AdminFavoriteAnalyticsData> {
  const range = resolveAnalyticsRange(period, fromParam, toParam);
  const supabase = createServiceClient();

  const [favoritesRes, categoriesRes, subCategoriesRes, toolsRes, assignmentsRes] =
    await Promise.all([
      supabase
        .from('favorites')
        .select('user_id, tool_id, created_at')
        .gte('created_at', range.from)
        .lte('created_at', range.to),
      supabase.from('categories').select('slug, name'),
      supabase.from('sub_categories').select('slug, name, category_slug'),
      supabase
        .from('tools')
        .select('id, slug, name, category_slug, sub_category'),
      supabase
        .from('tool_category_assignments')
        .select('tool_id, category_slug, sub_category'),
    ]);

  if (favoritesRes.error) {
    throw new Error(`즐겨찾기 조회 실패: ${favoritesRes.error.message}`);
  }
  if (categoriesRes.error) {
    throw new Error(`카테고리 조회 실패: ${categoriesRes.error.message}`);
  }
  if (subCategoriesRes.error) {
    throw new Error(`서브카테고리 조회 실패: ${subCategoriesRes.error.message}`);
  }
  if (toolsRes.error) {
    throw new Error(`서비스 조회 실패: ${toolsRes.error.message}`);
  }
  if (assignmentsRes.error) {
    throw new Error(`분류 조회 실패: ${assignmentsRes.error.message}`);
  }

  const categoryNameMap = Object.fromEntries(
    (categoriesRes.data ?? []).map((row) => [row.slug as string, row.name as string]),
  );
  const subNameMap = Object.fromEntries(
    (subCategoriesRes.data ?? []).map((row) => [row.slug as string, row.name as string]),
  );

  const toolMap = new Map(
    (toolsRes.data ?? []).map((row) => [
      row.id as string,
      {
        id: row.id as string,
        slug: row.slug as string,
        name: row.name as string,
        category_slug: row.category_slug as string,
        sub_category: (row.sub_category as string | null) ?? null,
      },
    ]),
  );

  const assignmentsByTool = new Map<
    string,
    Array<{ category_slug: string; sub_category: string | null }>
  >();

  for (const row of assignmentsRes.data ?? []) {
    const toolId = row.tool_id as string;
    const list = assignmentsByTool.get(toolId) ?? [];
    list.push({
      category_slug: row.category_slug as string,
      sub_category: (row.sub_category as string | null) ?? null,
    });
    assignmentsByTool.set(toolId, list);
  }

  const uniqueUsers = new Set<string>();
  const uniqueTools = new Set<string>();
  const categoryCounts: Record<string, number> = {};
  const subCounts: Record<string, number> = {};
  const toolCounts: Record<string, number> = {};

  for (const favorite of favoritesRes.data ?? []) {
    const userId = favorite.user_id as string;
    const toolId = favorite.tool_id as string;

    uniqueUsers.add(userId);
    uniqueTools.add(toolId);
    toolCounts[toolId] = (toolCounts[toolId] ?? 0) + 1;

    const assignments = assignmentsByTool.get(toolId);
    const tool = toolMap.get(toolId);

    const rows =
      assignments && assignments.length > 0
        ? assignments
        : tool
          ? [{ category_slug: tool.category_slug, sub_category: tool.sub_category }]
          : [];

    for (const row of rows) {
      categoryCounts[row.category_slug] = (categoryCounts[row.category_slug] ?? 0) + 1;
      if (row.sub_category) {
        subCounts[row.sub_category] = (subCounts[row.sub_category] ?? 0) + 1;
      }
    }
  }

  const categories: CategoryFavoriteStat[] = (categoriesRes.data ?? [])
    .map((row) => {
      const slug = row.slug as string;
      return {
        category_slug: slug,
        category_name: row.name as string,
        favorite_count: categoryCounts[slug] ?? 0,
      };
    })
    .sort((a, b) => b.favorite_count - a.favorite_count);

  const subCategories: SubCategoryFavoriteStat[] = (subCategoriesRes.data ?? [])
    .map((row) => {
      const slug = row.slug as string;
      const categorySlug = row.category_slug as string;
      return {
        sub_category_slug: slug,
        sub_category_name: row.name as string,
        category_slug: categorySlug,
        category_name: categoryNameMap[categorySlug] ?? categorySlug,
        favorite_count: subCounts[slug] ?? 0,
      };
    })
    .sort((a, b) => b.favorite_count - a.favorite_count);

  const tools: ToolFavoriteStat[] = [...toolMap.values()]
    .map((tool) => ({
      tool_id: tool.id,
      tool_slug: tool.slug,
      tool_name: tool.name,
      category_slug: tool.category_slug,
      category_name: categoryNameMap[tool.category_slug] ?? tool.category_slug,
      sub_category: tool.sub_category,
      sub_category_name: tool.sub_category
        ? subNameMap[tool.sub_category] ?? tool.sub_category
        : null,
      favorite_count: toolCounts[tool.id] ?? 0,
    }))
    .sort((a, b) => b.favorite_count - a.favorite_count);

  return {
    summary: {
      total: favoritesRes.data?.length ?? 0,
      uniqueUsers: uniqueUsers.size,
      uniqueTools: uniqueTools.size,
      range,
    },
    categories,
    subCategories,
    tools,
  };
}

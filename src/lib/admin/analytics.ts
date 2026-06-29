import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { ToolClickType } from '@/types/tool-analytics';

export type { ToolClickType } from '@/types/tool-analytics';

export type AnalyticsPeriod = '1d' | '7d' | '30d' | '90d' | 'custom';

export interface AnalyticsDateRange {
  from: string;
  to: string;
  period: AnalyticsPeriod;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalClicks: number;
  ctr: number;
  uniqueTools: number;
  range: AnalyticsDateRange;
}

export interface CategoryViewStat {
  category_slug: string;
  category_name: string;
  view_count: number;
  click_count: number;
  ctr: number;
  lifetime_view_count: number;
}

export interface SubCategoryViewStat {
  sub_category_slug: string;
  sub_category_name: string;
  category_slug: string;
  category_name: string;
  view_count: number;
  click_count: number;
  ctr: number;
  lifetime_view_count: number;
}

export interface ToolViewStat {
  tool_id: string;
  tool_slug: string;
  tool_name: string;
  category_slug: string;
  category_name: string;
  sub_category: string | null;
  sub_category_name: string | null;
  view_count: number;
  click_count: number;
  ctr: number;
  lifetime_view_count: number;
}

export interface AdminAnalyticsData {
  summary: AnalyticsSummary;
  categories: CategoryViewStat[];
  subCategories: SubCategoryViewStat[];
  tools: ToolViewStat[];
}

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export function resolveAnalyticsRange(
  period: AnalyticsPeriod,
  fromParam?: string | null,
  toParam?: string | null,
): AnalyticsDateRange {
  const to = toParam ? new Date(toParam) : new Date();
  const toIso = to.toISOString();

  if (period === 'custom' && fromParam) {
    return {
      period,
      from: new Date(fromParam).toISOString(),
      to: toIso,
    };
  }

  const from = new Date(to);
  switch (period) {
    case '1d':
      from.setHours(0, 0, 0, 0);
      break;
    case '7d':
      from.setDate(from.getDate() - 7);
      break;
    case '30d':
      from.setDate(from.getDate() - 30);
      break;
    case '90d':
      from.setDate(from.getDate() - 90);
      break;
    default:
      from.setDate(from.getDate() - 30);
      break;
  }

  return { period, from: from.toISOString(), to: toIso };
}

export function calcCtr(clicks: number, views: number): number {
  if (views <= 0) return 0;
  return Math.round((clicks / views) * 1000) / 10;
}

function incrementCount(
  map: Record<string, number>,
  key: string,
  amount = 1,
) {
  map[key] = (map[key] ?? 0) + amount;
}

/** 집계된 조회 이벤트 (기간 내) */
export async function getAdminAnalytics(
  period: AnalyticsPeriod,
  fromParam?: string | null,
  toParam?: string | null,
): Promise<AdminAnalyticsData> {
  const range = resolveAnalyticsRange(period, fromParam, toParam);
  const supabase = createServiceClient();

  const [eventsRes, clickEventsRes, categoriesRes, subCategoriesRes, toolsRes] =
    await Promise.all([
      supabase
        .from('tool_view_events')
        .select('tool_id, category_slug, sub_category')
        .gte('viewed_at', range.from)
        .lte('viewed_at', range.to),
      supabase
        .from('tool_click_events')
        .select('tool_id, category_slug, sub_category')
        .gte('clicked_at', range.from)
        .lte('clicked_at', range.to),
      supabase.from('categories').select('slug, name'),
      supabase.from('sub_categories').select('slug, name, category_slug'),
      supabase
        .from('tools')
        .select('id, slug, name, category_slug, sub_category, view_count'),
    ]);

  if (eventsRes.error) {
    throw new Error(`조회 이벤트 조회 실패: ${eventsRes.error.message}`);
  }
  if (clickEventsRes.error) {
    throw new Error(`클릭 이벤트 조회 실패: ${clickEventsRes.error.message}`);
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
        view_count: Number(row.view_count ?? 0),
      },
    ]),
  );

  const categoryCounts: Record<string, number> = {};
  const subCounts: Record<string, number> = {};
  const toolCounts: Record<string, number> = {};
  const categoryClickCounts: Record<string, number> = {};
  const subClickCounts: Record<string, number> = {};
  const toolClickCounts: Record<string, number> = {};
  const uniqueTools = new Set<string>();

  for (const event of eventsRes.data ?? []) {
    const toolId = event.tool_id as string;
    const categorySlug = event.category_slug as string;
    const subSlug = (event.sub_category as string | null) ?? null;

    uniqueTools.add(toolId);
    incrementCount(categoryCounts, categorySlug);
    incrementCount(toolCounts, toolId);
    if (subSlug) {
      incrementCount(subCounts, subSlug);
    }
  }

  for (const event of clickEventsRes.data ?? []) {
    const toolId = event.tool_id as string;
    const categorySlug = event.category_slug as string;
    const subSlug = (event.sub_category as string | null) ?? null;

    incrementCount(categoryClickCounts, categorySlug);
    incrementCount(toolClickCounts, toolId);
    if (subSlug) {
      incrementCount(subClickCounts, subSlug);
    }
  }

  const lifetimeByCategory: Record<string, number> = {};
  const lifetimeBySub: Record<string, number> = {};
  for (const tool of toolMap.values()) {
    lifetimeByCategory[tool.category_slug] =
      (lifetimeByCategory[tool.category_slug] ?? 0) + tool.view_count;
    if (tool.sub_category) {
      lifetimeBySub[tool.sub_category] =
        (lifetimeBySub[tool.sub_category] ?? 0) + tool.view_count;
    }
  }

  const categories: CategoryViewStat[] = (categoriesRes.data ?? [])
    .map((row) => {
      const slug = row.slug as string;
      const viewCount = categoryCounts[slug] ?? 0;
      const clickCount = categoryClickCounts[slug] ?? 0;
      return {
        category_slug: slug,
        category_name: row.name as string,
        view_count: viewCount,
        click_count: clickCount,
        ctr: calcCtr(clickCount, viewCount),
        lifetime_view_count: lifetimeByCategory[slug] ?? 0,
      };
    })
    .sort((a, b) => b.view_count - a.view_count);

  const subCategories: SubCategoryViewStat[] = (subCategoriesRes.data ?? [])
    .map((row) => {
      const slug = row.slug as string;
      const categorySlug = row.category_slug as string;
      const viewCount = subCounts[slug] ?? 0;
      const clickCount = subClickCounts[slug] ?? 0;
      return {
        sub_category_slug: slug,
        sub_category_name: row.name as string,
        category_slug: categorySlug,
        category_name: categoryNameMap[categorySlug] ?? categorySlug,
        view_count: viewCount,
        click_count: clickCount,
        ctr: calcCtr(clickCount, viewCount),
        lifetime_view_count: lifetimeBySub[slug] ?? 0,
      };
    })
    .sort((a, b) => b.view_count - a.view_count);

  const tools: ToolViewStat[] = [...toolMap.values()]
    .map((tool) => {
      const viewCount = toolCounts[tool.id] ?? 0;
      const clickCount = toolClickCounts[tool.id] ?? 0;
      return {
        tool_id: tool.id,
        tool_slug: tool.slug,
        tool_name: tool.name,
        category_slug: tool.category_slug,
        category_name: categoryNameMap[tool.category_slug] ?? tool.category_slug,
        sub_category: tool.sub_category,
        sub_category_name: tool.sub_category
          ? subNameMap[tool.sub_category] ?? tool.sub_category
          : null,
        view_count: viewCount,
        click_count: clickCount,
        ctr: calcCtr(clickCount, viewCount),
        lifetime_view_count: tool.view_count,
      };
    })
    .sort((a, b) => b.view_count - a.view_count);

  const totalViews = eventsRes.data?.length ?? 0;
  const totalClicks = clickEventsRes.data?.length ?? 0;

  return {
    summary: {
      totalViews,
      totalClicks,
      ctr: calcCtr(totalClicks, totalViews),
      uniqueTools: uniqueTools.size,
      range,
    },
    categories,
    subCategories,
    tools,
  };
}

async function resolveToolCategoryRows(
  toolId: string,
): Promise<Array<{ category_slug: string; sub_category: string | null }>> {
  const supabase = createServiceClient();

  const { data: assignments, error: assignmentError } = await supabase
    .from('tool_category_assignments')
    .select('category_slug, sub_category')
    .eq('tool_id', toolId)
    .order('sort_order', { ascending: true });

  if (!assignmentError && assignments && assignments.length > 0) {
    return assignments.map((row) => ({
      category_slug: row.category_slug as string,
      sub_category: (row.sub_category as string | null) ?? null,
    }));
  }

  const { data: tool } = await supabase
    .from('tools')
    .select('category_slug, sub_category')
    .eq('id', toolId)
    .maybeSingle();

  if (!tool) return [];

  return [
    {
      category_slug: tool.category_slug as string,
      sub_category: (tool.sub_category as string | null) ?? null,
    },
  ];
}

/** 서비스 상세 외부 링크 클릭 이벤트 기록 */
export async function logToolClickEvent(
  toolId: string,
  clickType: ToolClickType,
): Promise<void> {
  const rows = await resolveToolCategoryRows(toolId);

  if (rows.length === 0) {
    console.error('클릭 이벤트용 서비스 조회 실패: 없음');
    return;
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from('tool_click_events').insert(
    rows.map((row) => ({
      tool_id: toolId,
      category_slug: row.category_slug,
      sub_category: row.sub_category,
      click_type: clickType,
    })),
  );

  if (error) {
    console.error('클릭 이벤트 저장 실패:', error.message);
    throw new Error(error.message);
  }
}

/** 서비스 상세 조회 이벤트 기록 (모든 분류에 각각 기록) */
export async function logToolViewEvent(toolId: string): Promise<void> {
  const rows = await resolveToolCategoryRows(toolId);

  if (rows.length === 0) {
    console.error('조회 이벤트용 서비스 조회 실패: 없음');
    return;
  }

  const supabase = createServiceClient();

  const { error } = await supabase.from('tool_view_events').insert(
    rows.map((row) => ({
      tool_id: toolId,
      category_slug: row.category_slug,
      sub_category: row.sub_category,
    })),
  );

  if (error) {
    console.error('조회 이벤트 저장 실패:', error.message);
  }
}

/** 관리자 목록용 — 기간별 조회수 맵 (툴·카테고리·서브) */
export async function getPeriodViewCountMaps(
  period: AnalyticsPeriod = '30d',
): Promise<{
  range: AnalyticsDateRange;
  byTool: Record<string, number>;
  byCategory: Record<string, number>;
  bySubCategory: Record<string, number>;
}> {
  const range = resolveAnalyticsRange(period);
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('tool_view_events')
    .select('tool_id, category_slug, sub_category')
    .gte('viewed_at', range.from)
    .lte('viewed_at', range.to);

  if (error) {
    throw new Error(`기간별 조회수 조회 실패: ${error.message}`);
  }

  const byTool: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const bySubCategory: Record<string, number> = {};

  for (const row of data ?? []) {
    const toolId = row.tool_id as string;
    const categorySlug = row.category_slug as string;
    const subSlug = row.sub_category as string | null;

    byTool[toolId] = (byTool[toolId] ?? 0) + 1;
    byCategory[categorySlug] = (byCategory[categorySlug] ?? 0) + 1;
    if (subSlug) {
      bySubCategory[subSlug] = (bySubCategory[subSlug] ?? 0) + 1;
    }
  }

  return { range, byTool, byCategory, bySubCategory };
}

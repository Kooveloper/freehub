import {
  attachAssignmentsToTools,
  fetchAssignmentsByToolIds,
  toolInCategory,
} from '@/lib/tool-categories';
import { createStaticClient } from '@/lib/supabase/server';
import type { Category, Tool } from '@/types/tool';

const TOP_COUNT = 5;
const RANK_COMPARE_DAYS = 7;

export type RankChange = 'up' | 'down' | null;

export interface RankedPopularTool {
  tool: Tool;
  rankChange: RankChange;
}

export interface CategoryFeaturedEntry {
  category: Category;
  tools: RankedPopularTool[];
}

function buildViewRankMap(
  events: Array<{ tool_id: string }>,
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const row of events) {
    counts.set(row.tool_id, (counts.get(row.tool_id) ?? 0) + 1);
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const ranks = new Map<string, number>();
  sorted.forEach(([toolId], index) => {
    ranks.set(toolId, index + 1);
  });

  return ranks;
}

function compareRankChange(
  currentRank: number,
  previousRank: number | undefined,
): RankChange {
  if (previousRank == null) return null;
  if (previousRank > currentRank) return 'up';
  if (previousRank < currentRank) return 'down';
  return null;
}

async function fetchCategoryViewRanks(
  categorySlug: string,
  fromIso: string,
  toIso: string,
): Promise<Map<string, number>> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from('tool_view_events')
    .select('tool_id')
    .eq('category_slug', categorySlug)
    .gte('viewed_at', fromIso)
    .lt('viewed_at', toIso);

  if (error || !data) return new Map();
  return buildViewRankMap(data as Array<{ tool_id: string }>);
}

function resolveRankCompareRange(): { previousFrom: string; previousTo: string } {
  const now = new Date();
  const currentFrom = new Date(now);
  currentFrom.setDate(currentFrom.getDate() - RANK_COMPARE_DAYS);

  const previousTo = new Date(currentFrom);
  const previousFrom = new Date(currentFrom);
  previousFrom.setDate(previousFrom.getDate() - RANK_COMPARE_DAYS);

  return {
    previousFrom: previousFrom.toISOString(),
    previousTo: previousTo.toISOString(),
  };
}

/** 카테고리별 인기 Top 5 (어드민 순서 우선, 부족분은 조회수로 채움) */
export async function getPopularToolsByCategory(): Promise<
  CategoryFeaturedEntry[]
> {
  const supabase = createStaticClient();
  const rankRange = resolveRankCompareRange();

  const [categoriesRes, toolsRes, featuredRes] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase.from('tools').select('*').order('view_count', { ascending: false }),
    supabase
      .from('category_featured_tools')
      .select('category_slug, tool_id, sort_order')
      .order('sort_order', { ascending: true }),
  ]);

  const featuredRows = featuredRes.error ? [] : (featuredRes.data ?? []);

  if (categoriesRes.error) {
    throw new Error(`카테고리 조회 실패: ${categoriesRes.error.message}`);
  }
  if (toolsRes.error) {
    throw new Error(`툴 조회 실패: ${toolsRes.error.message}`);
  }

  const categories = (categoriesRes.data ?? []) as Category[];
  const allTools = (toolsRes.data ?? []) as Tool[];
  const assignmentMap = await fetchAssignmentsByToolIds(
    supabase,
    allTools.map((tool) => tool.id),
  );
  const enrichedTools = attachAssignmentsToTools(allTools, assignmentMap);
  const toolById = new Map(enrichedTools.map((tool) => [tool.id, tool]));
  const toolsByCategory = new Map<string, Tool[]>();

  for (const tool of enrichedTools) {
    for (const assignment of tool.category_assignments ?? []) {
      const list = toolsByCategory.get(assignment.category_slug) ?? [];
      if (!list.some((row) => row.id === tool.id)) {
        list.push(tool);
      }
      toolsByCategory.set(assignment.category_slug, list);
    }
  }

  const featuredByCategory = new Map<string, string[]>();
  for (const row of featuredRows) {
    const slug = row.category_slug as string;
    const list = featuredByCategory.get(slug) ?? [];
    list.push(row.tool_id as string);
    featuredByCategory.set(slug, list);
  }

  const previousRanksByCategory = new Map<string, Map<string, number>>();
  await Promise.all(
    categories.map(async (category) => {
      const ranks = await fetchCategoryViewRanks(
        category.slug,
        rankRange.previousFrom,
        rankRange.previousTo,
      );
      previousRanksByCategory.set(category.slug, ranks);
    }),
  );

  return categories.map((category) => {
    const categoryTools = toolsByCategory.get(category.slug) ?? [];
    const featuredIds = featuredByCategory.get(category.slug) ?? [];

    const featuredTools = featuredIds
      .map((id) => toolById.get(id))
      .filter(
        (tool): tool is Tool =>
          tool != null && toolInCategory(tool, category.slug),
      )
      .slice(0, TOP_COUNT);

    let topTools: Tool[];

    if (featuredTools.length >= TOP_COUNT) {
      topTools = featuredTools;
    } else {
      const usedIds = new Set(featuredTools.map((t) => t.id));
      const fillers = categoryTools
        .filter((t) => !usedIds.has(t.id))
        .sort((a, b) => b.view_count - a.view_count)
        .slice(0, TOP_COUNT - featuredTools.length);

      topTools = [...featuredTools, ...fillers];
    }

    const previousRanks = previousRanksByCategory.get(category.slug) ?? new Map();

    return {
      category,
      tools: topTools.map((tool, index) => ({
        tool,
        rankChange: compareRankChange(index + 1, previousRanks.get(tool.id)),
      })),
    };
  });
}

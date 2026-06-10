import { createStaticClient } from '@/lib/supabase/server';
import type { Category, Tool } from '@/types/tool';

const TOP_COUNT = 5;

export interface CategoryFeaturedEntry {
  category: Category;
  tools: Tool[];
}

/** 카테고리별 인기 Top 5 (어드민 순서 우선, 부족분은 조회수로 채움) */
export async function getPopularToolsByCategory(): Promise<
  CategoryFeaturedEntry[]
> {
  const supabase = createStaticClient();

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
  const toolById = new Map(allTools.map((tool) => [tool.id, tool]));
  const toolsByCategory = new Map<string, Tool[]>();

  for (const tool of allTools) {
    const list = toolsByCategory.get(tool.category_slug) ?? [];
    list.push(tool);
    toolsByCategory.set(tool.category_slug, list);
  }

  const featuredByCategory = new Map<string, string[]>();
  for (const row of featuredRows) {
    const slug = row.category_slug as string;
    const list = featuredByCategory.get(slug) ?? [];
    list.push(row.tool_id as string);
    featuredByCategory.set(slug, list);
  }

  return categories.map((category) => {
    const categoryTools = toolsByCategory.get(category.slug) ?? [];
    const featuredIds = featuredByCategory.get(category.slug) ?? [];

    const featuredTools = featuredIds
      .map((id) => toolById.get(id))
      .filter((tool): tool is Tool => tool != null && tool.category_slug === category.slug)
      .slice(0, TOP_COUNT);

    if (featuredTools.length >= TOP_COUNT) {
      return { category, tools: featuredTools };
    }

    const usedIds = new Set(featuredTools.map((t) => t.id));
    const fillers = categoryTools
      .filter((t) => !usedIds.has(t.id))
      .sort((a, b) => b.view_count - a.view_count)
      .slice(0, TOP_COUNT - featuredTools.length);

    return { category, tools: [...featuredTools, ...fillers] };
  });
}

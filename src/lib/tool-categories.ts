import type { SupabaseClient } from '@supabase/supabase-js';

import type { Tool, ToolCategoryAssignment } from '@/types/tool';

export type ToolCategoryAssignmentInput = {
  category_slug: string;
  sub_category: string | null;
};

export function assignmentKey(
  categorySlug: string,
  subCategory: string | null,
): string {
  return `${categorySlug}::${subCategory ?? ''}`;
}

/** 툴의 분류 목록 (assignments 없으면 legacy 단일 필드 사용) */
export function getToolAssignments(tool: Tool): ToolCategoryAssignmentInput[] {
  if (tool.category_assignments?.length) {
    return tool.category_assignments.map((row) => ({
      category_slug: row.category_slug,
      sub_category: row.sub_category,
    }));
  }

  return [
    {
      category_slug: tool.category_slug,
      sub_category: tool.sub_category ?? null,
    },
  ];
}

export function getPrimaryAssignment(
  assignments: ToolCategoryAssignmentInput[],
): ToolCategoryAssignmentInput {
  return assignments[0] ?? { category_slug: '', sub_category: null };
}

export function normalizeCategoryAssignments(
  assignments: ToolCategoryAssignmentInput[],
): ToolCategoryAssignmentInput[] {
  const seen = new Set<string>();
  const normalized: ToolCategoryAssignmentInput[] = [];

  for (const row of assignments) {
    const categorySlug = row.category_slug.trim();
    if (!categorySlug) continue;

    const subCategory = row.sub_category?.trim() || null;
    const key = assignmentKey(categorySlug, subCategory);
    if (seen.has(key)) continue;

    seen.add(key);
    normalized.push({ category_slug: categorySlug, sub_category: subCategory });
  }

  return normalized;
}

export function toolInCategory(tool: Tool, categorySlug: string): boolean {
  return getToolAssignments(tool).some(
    (row) => row.category_slug === categorySlug,
  );
}

export function toolInSubCategory(
  tool: Tool,
  categorySlug: string,
  subCategorySlug: string,
): boolean {
  return getToolAssignments(tool).some(
    (row) =>
      row.category_slug === categorySlug &&
      row.sub_category === subCategorySlug,
  );
}

export function toolMatchesAdminFilters(
  tool: Tool,
  categorySlug?: string,
  subCategorySlug?: string,
): boolean {
  const assignments = getToolAssignments(tool);

  if (categorySlug && subCategorySlug) {
    return assignments.some(
      (row) =>
        row.category_slug === categorySlug &&
        row.sub_category === subCategorySlug,
    );
  }

  if (categorySlug) {
    return assignments.some((row) => row.category_slug === categorySlug);
  }

  if (subCategorySlug) {
    return assignments.some((row) => row.sub_category === subCategorySlug);
  }

  return true;
}

export function getAssignmentInCategory(
  tool: Tool,
  categorySlug: string,
): ToolCategoryAssignmentInput | undefined {
  return getToolAssignments(tool).find(
    (row) => row.category_slug === categorySlug,
  );
}

export async function fetchAssignmentsByToolIds(
  supabase: SupabaseClient,
  toolIds: string[],
): Promise<Map<string, ToolCategoryAssignment[]>> {
  const map = new Map<string, ToolCategoryAssignment[]>();
  if (toolIds.length === 0) return map;

  const { data, error } = await supabase
    .from('tool_category_assignments')
    .select('id, tool_id, category_slug, sub_category, sort_order')
    .in('tool_id', toolIds)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`서비스 분류 조회 실패: ${error.message}`);
  }

  for (const row of data ?? []) {
    const toolId = row.tool_id as string;
    const list = map.get(toolId) ?? [];
    list.push({
      id: row.id as string,
      tool_id: toolId,
      category_slug: row.category_slug as string,
      sub_category: (row.sub_category as string | null) ?? null,
      sort_order: Number(row.sort_order ?? 0),
    });
    map.set(toolId, list);
  }

  return map;
}

export function attachAssignmentsToTools(
  tools: Tool[],
  assignmentMap: Map<string, ToolCategoryAssignment[]>,
): Tool[] {
  return tools.map((tool) => {
    const assignments = assignmentMap.get(tool.id) ?? [];
    if (assignments.length === 0) return tool;

    const primary = assignments[0];
    return {
      ...tool,
      category_assignments: assignments,
      category_slug: primary.category_slug,
      sub_category: primary.sub_category,
    };
  });
}

export async function loadToolsWithAssignments(
  supabase: SupabaseClient,
  tools: Tool[],
): Promise<Tool[]> {
  const assignmentMap = await fetchAssignmentsByToolIds(
    supabase,
    tools.map((tool) => tool.id),
  );
  return attachAssignmentsToTools(tools, assignmentMap);
}

export async function replaceToolCategoryAssignments(
  supabase: SupabaseClient,
  toolId: string,
  assignments: ToolCategoryAssignmentInput[],
): Promise<string[]> {
  const normalized = normalizeCategoryAssignments(assignments);
  if (normalized.length === 0) {
    throw new Error('최소 1개의 카테고리 분류가 필요합니다.');
  }

  const primary = getPrimaryAssignment(normalized);

  const { error: deleteError } = await supabase
    .from('tool_category_assignments')
    .delete()
    .eq('tool_id', toolId);

  if (deleteError) {
    throw new Error(`기존 분류 삭제 실패: ${deleteError.message}`);
  }

  const rows = normalized.map((row, index) => ({
    tool_id: toolId,
    category_slug: row.category_slug,
    sub_category: row.sub_category,
    sort_order: index,
  }));

  const { error: insertError } = await supabase
    .from('tool_category_assignments')
    .insert(rows);

  if (insertError) {
    throw new Error(`분류 저장 실패: ${insertError.message}`);
  }

  const { error: syncError } = await supabase
    .from('tools')
    .update({
      category_slug: primary.category_slug,
      sub_category: primary.sub_category,
    })
    .eq('id', toolId);

  if (syncError) {
    throw new Error(`주 분류 동기화 실패: ${syncError.message}`);
  }

  return [...new Set(normalized.map((row) => row.category_slug))];
}

export async function getToolIdsByCategorySlug(
  supabase: SupabaseClient,
  categorySlug: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('tool_category_assignments')
    .select('tool_id')
    .eq('category_slug', categorySlug);

  if (error) {
    throw new Error(`카테고리 툴 ID 조회 실패: ${error.message}`);
  }

  return [...new Set((data ?? []).map((row) => row.tool_id as string))];
}

export async function getToolIdsBySubCategorySlug(
  supabase: SupabaseClient,
  subCategorySlug: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('tool_category_assignments')
    .select('tool_id')
    .eq('sub_category', subCategorySlug);

  if (error) {
    throw new Error(`서브카테고리 툴 ID 조회 실패: ${error.message}`);
  }

  return [...new Set((data ?? []).map((row) => row.tool_id as string))];
}

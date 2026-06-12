import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { AdminItemStatus } from '@/constants/admin-status';
import type { SubmissionType } from '@/types/submission';
import type { Category, SubCategory, Tool } from '@/types/tool';

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export interface AdminSubmission {
  id: string;
  type: SubmissionType;
  tool_name: string | null;
  tool_url: string | null;
  description: string;
  submitter_email: string | null;
  status: AdminItemStatus;
  created_at: string;
}

export interface AdminToolRequest {
  id: string;
  title: string;
  content: string;
  email: string | null;
  status: AdminItemStatus;
  admin_memo: string | null;
  created_at: string;
}

export type AdminCategory = Category & {
  tool_count: number;
  /** 소속 툴 상세 페이지 조회수 합계 */
  view_count_sum: number;
};

/** 관리자 카테고리 목록 (툴 수·누적 조회수 포함) */
export async function getAdminCategories(): Promise<AdminCategory[]> {
  const supabase = createServiceClient();

  const [categoriesRes, toolsRes] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order', { ascending: true }),
    supabase.from('tools').select('category_slug, view_count'),
  ]);

  if (categoriesRes.error) {
    throw new Error(`카테고리 조회 실패: ${categoriesRes.error.message}`);
  }
  if (toolsRes.error) {
    throw new Error(`툴 수 조회 실패: ${toolsRes.error.message}`);
  }

  const toolCounts: Record<string, number> = {};
  const viewCountSums: Record<string, number> = {};
  for (const row of toolsRes.data ?? []) {
    const slug = row.category_slug as string;
    toolCounts[slug] = (toolCounts[slug] ?? 0) + 1;
    viewCountSums[slug] =
      (viewCountSums[slug] ?? 0) + Number(row.view_count ?? 0);
  }

  return ((categoriesRes.data ?? []) as Category[]).map((category) => ({
    ...category,
    tool_count: toolCounts[category.slug] ?? 0,
    view_count_sum: viewCountSums[category.slug] ?? 0,
  }));
}

export type AdminSubCategory = SubCategory & {
  tool_count: number;
  view_count_sum: number;
};

/** 관리자 서브카테고리 전체 목록 (툴 수·누적 조회수 포함) */
export async function getAdminSubCategories(): Promise<AdminSubCategory[]> {
  const supabase = createServiceClient();

  const [subCategoriesRes, toolsRes] = await Promise.all([
    supabase
      .from('sub_categories')
      .select('*')
      .order('category_slug', { ascending: true })
      .order('sort_order', { ascending: true }),
    supabase
      .from('tools')
      .select('sub_category, view_count')
      .not('sub_category', 'is', null),
  ]);

  if (subCategoriesRes.error) {
    throw new Error(`서브카테고리 조회 실패: ${subCategoriesRes.error.message}`);
  }
  if (toolsRes.error) {
    throw new Error(`툴 수 조회 실패: ${toolsRes.error.message}`);
  }

  const toolCounts: Record<string, number> = {};
  const viewCountSums: Record<string, number> = {};
  for (const row of toolsRes.data ?? []) {
    const slug = row.sub_category as string;
    toolCounts[slug] = (toolCounts[slug] ?? 0) + 1;
    viewCountSums[slug] =
      (viewCountSums[slug] ?? 0) + Number(row.view_count ?? 0);
  }

  return ((subCategoriesRes.data ?? []) as SubCategory[]).map((subCategory) => ({
    ...subCategory,
    tool_count: toolCounts[subCategory.slug] ?? 0,
    view_count_sum: viewCountSums[subCategory.slug] ?? 0,
  }));
}

export interface AdminDashboardData {
  stats: {
    toolCount: number;
    categoryCount: number;
    pendingSubmissionCount: number;
    pendingRequestCount: number;
  };
  recentTools: Tool[];
  pendingSubmissions: AdminSubmission[];
  pendingRequests: AdminToolRequest[];
}

/** 관리자 대시보드 데이터 일괄 조회 */
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = createServiceClient();

  const [
    toolsCountRes,
    categoriesCountRes,
    pendingSubmissionsCountRes,
    pendingRequestsCountRes,
    recentToolsRes,
    pendingSubmissionsRes,
    pendingRequestsRes,
  ] = await Promise.all([
    supabase.from('tools').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('tool_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('tools')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('submissions')
      .select(
        'id, type, tool_name, tool_url, description, submitter_email, status, created_at',
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('tool_requests')
      .select('id, title, content, email, status, admin_memo, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  if (toolsCountRes.error) {
    throw new Error(`툴 개수 조회 실패: ${toolsCountRes.error.message}`);
  }
  if (categoriesCountRes.error) {
    throw new Error(`카테고리 개수 조회 실패: ${categoriesCountRes.error.message}`);
  }
  if (pendingSubmissionsCountRes.error) {
    throw new Error(
      `미처리 제보 개수 조회 실패: ${pendingSubmissionsCountRes.error.message}`,
    );
  }
  if (pendingRequestsCountRes.error) {
    throw new Error(
      `미처리 요청 개수 조회 실패: ${pendingRequestsCountRes.error.message}`,
    );
  }
  if (recentToolsRes.error) {
    throw new Error(`최근 툴 조회 실패: ${recentToolsRes.error.message}`);
  }
  if (pendingSubmissionsRes.error) {
    throw new Error(`미처리 제보 조회 실패: ${pendingSubmissionsRes.error.message}`);
  }
  if (pendingRequestsRes.error) {
    throw new Error(`미처리 요청 조회 실패: ${pendingRequestsRes.error.message}`);
  }

  return {
    stats: {
      toolCount: toolsCountRes.count ?? 0,
      categoryCount: categoriesCountRes.count ?? 0,
      pendingSubmissionCount: pendingSubmissionsCountRes.count ?? 0,
      pendingRequestCount: pendingRequestsCountRes.count ?? 0,
    },
    recentTools: (recentToolsRes.data ?? []) as Tool[],
    pendingSubmissions: (pendingSubmissionsRes.data ?? []) as AdminSubmission[],
    pendingRequests: (pendingRequestsRes.data ?? []) as AdminToolRequest[],
  };
}

/** 관리자 툴 목록 */
export async function getAdminTools(): Promise<Tool[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`툴 목록 조회 실패: ${error.message}`);
  }

  return (data ?? []) as Tool[];
}

/** 관리자 툴 단건 조회 */
export async function getAdminToolById(id: string): Promise<Tool | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`툴 조회 실패: ${error.message}`);
  }

  return (data as Tool | null) ?? null;
}

/** 관리자 제보 목록 */
export async function getAdminSubmissions(): Promise<AdminSubmission[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('submissions')
    .select(
      'id, type, tool_name, tool_url, description, submitter_email, status, created_at',
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`제보 목록 조회 실패: ${error.message}`);
  }

  return (data ?? []) as AdminSubmission[];
}

/** 관리자 요청 목록 */
export async function getAdminToolRequests(): Promise<AdminToolRequest[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('tool_requests')
    .select('id, title, content, email, status, admin_memo, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`요청 목록 조회 실패: ${error.message}`);
  }

  return (data ?? []) as AdminToolRequest[];
}

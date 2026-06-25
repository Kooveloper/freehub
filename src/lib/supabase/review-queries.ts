import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { maskNicknameForDisplay } from '@/lib/nickname';
import type { ReviewListResponse, ReviewSort, ToolReview } from '@/types/review';

const PAGE_SIZE = 5;

const REVIEW_COLUMNS =
  'id, tool_id, user_id, rating, content, created_at, updated_at';

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface ReviewRow {
  id: string;
  tool_id: string;
  user_id: string;
  rating: number;
  content: string;
  created_at: string;
  updated_at: string;
}

interface ReviewRowWithTool extends ReviewRow {
  tools: { name: string; slug: string } | { name: string; slug: string }[] | null;
}

async function fetchNicknameMap(userIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const uniqueIds = [...new Set(userIds)];
  if (uniqueIds.length === 0) return map;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, nickname')
    .in('user_id', uniqueIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    map.set(row.user_id as string, row.nickname as string);
  }

  return map;
}

async function attachLikeCounts(
  reviewIds: string[],
  currentUserId?: string | null,
): Promise<Map<string, { likeCount: number; isLiked: boolean }>> {
  const result = new Map<string, { likeCount: number; isLiked: boolean }>();

  if (reviewIds.length === 0) return result;

  const supabase = createServiceClient();

  const { data: likes, error } = await supabase
    .from('review_likes')
    .select('review_id, user_id')
    .in('review_id', reviewIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const reviewId of reviewIds) {
    result.set(reviewId, { likeCount: 0, isLiked: false });
  }

  for (const row of likes ?? []) {
    const reviewId = row.review_id as string;
    const entry = result.get(reviewId) ?? { likeCount: 0, isLiked: false };
    entry.likeCount += 1;
    if (currentUserId && row.user_id === currentUserId) {
      entry.isLiked = true;
    }
    result.set(reviewId, entry);
  }

  return result;
}

function mapReviewRow(
  row: ReviewRow,
  nicknameMap: Map<string, string>,
  likeMeta: { likeCount: number; isLiked: boolean },
  currentUserId?: string | null,
  maskAuthorNickname = false,
): ToolReview {
  const rawNickname = nicknameMap.get(row.user_id) ?? '익명';
  const isOwn = currentUserId ? row.user_id === currentUserId : false;

  return {
    id: row.id,
    tool_id: row.tool_id,
    user_id: row.user_id,
    rating: row.rating,
    content: row.content,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author_nickname:
      maskAuthorNickname && !isOwn
        ? maskNicknameForDisplay(rawNickname)
        : rawNickname,
    like_count: likeMeta.likeCount,
    is_liked: likeMeta.isLiked,
    is_own: isOwn,
  };
}

async function mapReviewRows(
  rows: ReviewRow[],
  currentUserId?: string | null,
  maskAuthorNickname = false,
): Promise<ToolReview[]> {
  const [nicknameMap, likeMeta] = await Promise.all([
    fetchNicknameMap(rows.map((row) => row.user_id)),
    attachLikeCounts(
      rows.map((row) => row.id),
      currentUserId,
    ),
  ]);

  return rows.map((row) =>
    mapReviewRow(
      row,
      nicknameMap,
      likeMeta.get(row.id) ?? { likeCount: 0, isLiked: false },
      currentUserId,
      maskAuthorNickname,
    ),
  );
}

function getToolFromRow(
  row: ReviewRowWithTool,
): { name: string; slug: string } | undefined {
  const tool = Array.isArray(row.tools) ? row.tools[0] : row.tools;
  return tool ?? undefined;
}

export async function getToolReviews(params: {
  toolId: string;
  page?: number;
  sort?: ReviewSort;
  rating?: number | null;
  currentUserId?: string | null;
}): Promise<ReviewListResponse> {
  const supabase = createServiceClient();
  const page = Math.max(1, params.page ?? 1);
  const sort = params.sort ?? 'latest';
  const rating = params.rating ?? null;

  let countQuery = supabase
    .from('tool_reviews')
    .select('id', { count: 'exact', head: true })
    .eq('tool_id', params.toolId);

  if (rating) {
    countQuery = countQuery.eq('rating', rating);
  }

  const { count, error: countError } = await countQuery;
  if (countError) {
    throw new Error(countError.message);
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let dataQuery = supabase
    .from('tool_reviews')
    .select(REVIEW_COLUMNS)
    .eq('tool_id', params.toolId);

  if (rating) {
    dataQuery = dataQuery.eq('rating', rating);
  }

  if (sort === 'recommended') {
    const { data: allRows, error: allError } = await dataQuery;
    if (allError) {
      throw new Error(allError.message);
    }

    const rows = (allRows ?? []) as ReviewRow[];
    const likeMeta = await attachLikeCounts(
      rows.map((row) => row.id),
      params.currentUserId,
    );

    const sorted = rows
      .map((row) => ({
        row,
        likeCount: likeMeta.get(row.id)?.likeCount ?? 0,
      }))
      .sort((a, b) => {
        if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
        return (
          new Date(b.row.created_at).getTime() -
          new Date(a.row.created_at).getTime()
        );
      });

    const pageRows = sorted.slice(from, from + PAGE_SIZE).map(({ row }) => row);
    const reviews = await mapReviewRows(pageRows, params.currentUserId, true);

    const summary = await getToolReviewSummary(params.toolId);

    let userReview: ToolReview | null = null;
    if (params.currentUserId) {
      userReview = await getUserReviewForTool(params.toolId, params.currentUserId);
    }

    return {
      reviews,
      total,
      page: safePage,
      pageSize: PAGE_SIZE,
      totalPages,
      summary,
      userReview,
    };
  }

  const { data, error } = await dataQuery
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ReviewRow[];
  const reviews = await mapReviewRows(rows, params.currentUserId, true);
  const summary = await getToolReviewSummary(params.toolId);

  let userReview: ToolReview | null = null;
  if (params.currentUserId) {
    userReview = await getUserReviewForTool(params.toolId, params.currentUserId);
  }

  return {
    reviews,
    total,
    page: safePage,
    pageSize: PAGE_SIZE,
    totalPages,
    summary,
    userReview,
  };
}

export async function getToolReviewSummary(toolId: string) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('tool_reviews')
    .select('rating')
    .eq('tool_id', toolId);

  if (error) {
    throw new Error(error.message);
  }

  const byRating: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;

  for (const row of data ?? []) {
    const rating = Number(row.rating);
    byRating[rating] = (byRating[rating] ?? 0) + 1;
    totalRating += rating;
  }

  const totalReviews = data?.length ?? 0;

  return {
    averageRating: totalReviews > 0 ? totalRating / totalReviews : 0,
    totalReviews,
    byRating,
  };
}

export async function getUserReviewForTool(
  toolId: string,
  userId: string,
): Promise<ToolReview | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('tool_reviews')
    .select(REVIEW_COLUMNS)
    .eq('tool_id', toolId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  const [review] = await mapReviewRows([data as ReviewRow], userId);
  return review ?? null;
}

export async function getReviewsForAdmin(params: {
  toolId?: string | null;
  categorySlug?: string | null;
  subCategorySlug?: string | null;
  from?: string | null;
  to?: string | null;
  page?: number;
  pageSize?: number;
}): Promise<{ reviews: ToolReview[]; total: number }> {
  const supabase = createServiceClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 20;

  let toolIds: string[] | null = null;

  if (params.toolId) {
    toolIds = [params.toolId];
  } else if (params.subCategorySlug) {
    const { data, error } = await supabase
      .from('tools')
      .select('id')
      .eq('sub_category', params.subCategorySlug);
    if (error) throw new Error(error.message);
    toolIds = (data ?? []).map((row) => row.id as string);
  } else if (params.categorySlug) {
    const { data: assignmentRows, error: assignmentError } = await supabase
      .from('tool_category_assignments')
      .select('tool_id')
      .eq('category_slug', params.categorySlug);
    if (assignmentError) throw new Error(assignmentError.message);

    const assignmentIds = new Set(
      (assignmentRows ?? []).map((row) => row.tool_id as string),
    );

    const { data: primaryRows, error: primaryError } = await supabase
      .from('tools')
      .select('id')
      .eq('category_slug', params.categorySlug);
    if (primaryError) throw new Error(primaryError.message);

    for (const row of primaryRows ?? []) {
      assignmentIds.add(row.id as string);
    }

    toolIds = [...assignmentIds];
  }

  let countQuery = supabase
    .from('tool_reviews')
    .select('id', { count: 'exact', head: true });

  if (toolIds) {
    if (toolIds.length === 0) {
      return { reviews: [], total: 0 };
    }
    countQuery = countQuery.in('tool_id', toolIds);
  }

  if (params.from) {
    countQuery = countQuery.gte('created_at', params.from);
  }
  if (params.to) {
    countQuery = countQuery.lte('created_at', params.to);
  }

  const { count, error: countError } = await countQuery;
  if (countError) throw new Error(countError.message);

  const total = count ?? 0;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let dataQuery = supabase
    .from('tool_reviews')
    .select(`${REVIEW_COLUMNS}, tools(name, slug)`)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (toolIds) {
    dataQuery = dataQuery.in('tool_id', toolIds);
  }
  if (params.from) {
    dataQuery = dataQuery.gte('created_at', params.from);
  }
  if (params.to) {
    dataQuery = dataQuery.lte('created_at', params.to);
  }

  const { data, error } = await dataQuery;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as ReviewRowWithTool[];
  const mapped = await mapReviewRows(rows);

  return {
    total,
    reviews: mapped.map((review, index) => {
      const tool = getToolFromRow(rows[index]!);
      return {
        ...review,
        tool_name: tool?.name,
        tool_slug: tool?.slug,
      };
    }),
  };
}

export async function getUserReviewsForAdmin(userId: string): Promise<ToolReview[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('tool_reviews')
    .select(`${REVIEW_COLUMNS}, tools(name, slug)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as ReviewRowWithTool[];
  const mapped = await mapReviewRows(rows);

  return mapped.map((review, index) => {
    const tool = getToolFromRow(rows[index]!);
    return {
      ...review,
      tool_name: tool?.name,
      tool_slug: tool?.slug,
    };
  });
}

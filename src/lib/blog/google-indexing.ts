import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { buildBlogPostUrl, isGoogleSearchConsoleConfigured } from '@/lib/google/gsc-auth';
import { submitUrlForIndexing } from '@/lib/google/gsc-indexing';
import { inspectUrl } from '@/lib/google/gsc-inspection';

/** Indexing API 기본 일일 할당량 (버퍼 포함) */
const MAX_SUBMIT_PER_RUN = 180;
/** URL Inspection API 일일 할당량 (버퍼 포함) */
const MAX_INSPECT_PER_RUN = 1900;
/** 미색인 글 재요청 전 대기 (일) */
const RESUBMIT_COOLDOWN_DAYS = 3;
/** 색인 상태 재확인 주기 (일) */
const REINSPECT_AFTER_DAYS = 7;

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

async function upsertLog(
  postId: string,
  url: string,
  patch: Record<string, unknown>,
) {
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  await supabase.from('blog_indexing_log').upsert(
    {
      post_id: postId,
      url,
      updated_at: now,
      ...patch,
    },
    { onConflict: 'post_id' },
  );
}

/** 블로그 발행 직후 색인 요청 (Indexing API) */
export async function requestIndexingForBlogPost(
  postId: string,
  slug: string,
): Promise<void> {
  if (!isGoogleSearchConsoleConfigured()) return;

  const url = buildBlogPostUrl(slug);
  const result = await submitUrlForIndexing(url);
  const now = new Date().toISOString();

  if (result.ok) {
    const supabase = createServiceClient();
    const { data: existing } = await supabase
      .from('blog_indexing_log')
      .select('submit_count')
      .eq('post_id', postId)
      .maybeSingle();

    await upsertLog(postId, url, {
      last_submitted_at: now,
      submit_count: (existing?.submit_count ?? 0) + 1,
      last_error: null,
    });
    console.info(`[gsc] indexing submitted: ${url}`);
    return;
  }

  await upsertLog(postId, url, { last_error: result.error });
  console.error(`[gsc] indexing failed: ${url} — ${result.error}`);
}

/** 발행 API 응답을 막지 않도록 백그라운드 실행 */
export function scheduleBlogIndexingRequest(postId: string, slug: string): void {
  void requestIndexingForBlogPost(postId, slug).catch((error) => {
    console.error('[gsc] scheduleBlogIndexingRequest failed', error);
  });
}

interface PublishedPostRow {
  id: string;
  slug: string;
  published_at: string | null;
}

interface IndexingLogRow {
  post_id: string;
  is_indexed: boolean | null;
  last_inspected_at: string | null;
  last_submitted_at: string | null;
  submit_count: number;
}

export interface BlogIndexingCronResult {
  skipped?: boolean;
  reason?: string;
  inspected: number;
  submitted: number;
  alreadyIndexed: number;
  errors: string[];
}

/** 기존 발행 글 색인 상태 확인 + 미색인 URL 색인 요청 */
export async function runBlogIndexingBackfill(): Promise<BlogIndexingCronResult> {
  if (!isGoogleSearchConsoleConfigured()) {
    return {
      skipped: true,
      reason: 'not_configured',
      inspected: 0,
      submitted: 0,
      alreadyIndexed: 0,
      errors: [],
    };
  }

  const supabase = createServiceClient();
  const { data: posts, error: postsError } = await supabase
    .from('blog_posts')
    .select('id, slug, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: true });

  if (postsError) {
    throw new Error(`blog_posts query failed: ${postsError.message}`);
  }

  const publishedPosts = (posts ?? []) as PublishedPostRow[];
  if (publishedPosts.length === 0) {
    return {
      inspected: 0,
      submitted: 0,
      alreadyIndexed: 0,
      errors: [],
    };
  }

  const postIds = publishedPosts.map((post) => post.id);
  const { data: logs } = await supabase
    .from('blog_indexing_log')
    .select('post_id, is_indexed, last_inspected_at, last_submitted_at, submit_count')
    .in('post_id', postIds);

  const logByPostId = new Map(
    ((logs ?? []) as IndexingLogRow[]).map((log) => [log.post_id, log]),
  );

  const reinspectBefore = daysAgo(REINSPECT_AFTER_DAYS);
  const resubmitBefore = daysAgo(RESUBMIT_COOLDOWN_DAYS);

  const toInspect = publishedPosts.filter((post) => {
    const log = logByPostId.get(post.id);
    if (!log?.last_inspected_at) return true;
    return log.last_inspected_at < reinspectBefore;
  });

  let inspected = 0;
  let submitted = 0;
  let alreadyIndexed = 0;
  const errors: string[] = [];

  for (const post of toInspect.slice(0, MAX_INSPECT_PER_RUN)) {
    const url = buildBlogPostUrl(post.slug);
    const inspection = await inspectUrl(url);
    inspected += 1;

    if (!inspection.ok) {
      errors.push(`${url}: inspect — ${inspection.error}`);
      await upsertLog(post.id, url, { last_error: inspection.error });
      continue;
    }

    const { result } = inspection;
    await upsertLog(post.id, url, {
      is_indexed: result.isIndexed,
      coverage_state: result.coverageState,
      indexing_verdict: result.verdict,
      last_inspected_at: new Date().toISOString(),
      last_error: null,
    });

    if (result.isIndexed) {
      alreadyIndexed += 1;
    }
  }

  // 최신 로그 다시 로드 (inspect 결과 반영)
  const { data: refreshedLogs } = await supabase
    .from('blog_indexing_log')
    .select('post_id, is_indexed, last_inspected_at, last_submitted_at, submit_count')
    .in('post_id', postIds);

  const refreshedByPostId = new Map(
    ((refreshedLogs ?? []) as IndexingLogRow[]).map((log) => [log.post_id, log]),
  );

  const toSubmit = publishedPosts.filter((post) => {
    const log = refreshedByPostId.get(post.id);
    if (log?.is_indexed) return false;
    if (!log?.last_submitted_at) return true;
    return log.last_submitted_at < resubmitBefore;
  });

  for (const post of toSubmit.slice(0, MAX_SUBMIT_PER_RUN)) {
    const url = buildBlogPostUrl(post.slug);
    const submitResult = await submitUrlForIndexing(url);

    if (!submitResult.ok) {
      errors.push(`${url}: submit — ${submitResult.error}`);
      await upsertLog(post.id, url, { last_error: submitResult.error });
      continue;
    }

    submitted += 1;
    const log = refreshedByPostId.get(post.id);
    await upsertLog(post.id, url, {
      last_submitted_at: new Date().toISOString(),
      submit_count: (log?.submit_count ?? 0) + 1,
      last_error: null,
    });
  }

  return {
    inspected,
    submitted,
    alreadyIndexed,
    errors: errors.slice(0, 20),
  };
}

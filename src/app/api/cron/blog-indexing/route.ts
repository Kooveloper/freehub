import { NextResponse } from 'next/server';

import { runBlogIndexingBackfill } from '@/lib/blog/google-indexing';

export const dynamic = 'force-dynamic';

/**
 * 매일 미색인 블로그 글 URL Inspection → Indexing API 색인 요청.
 *
 * 필요 env:
 * - CRON_SECRET
 * - GOOGLE_SERVICE_ACCOUNT_JSON (서비스 계정 JSON 전체)
 * - GOOGLE_SEARCH_CONSOLE_SITE_URL (예: https://freehub.kr/ 또는 sc-domain:freehub.kr)
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[cron/blog-indexing] CRON_SECRET is not configured');
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const authorization = request.headers.get('authorization');
  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runBlogIndexingBackfill();
    console.info('[cron/blog-indexing]', result);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[cron/blog-indexing]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

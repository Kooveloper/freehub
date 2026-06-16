import { Ratelimit } from '@upstash/ratelimit';
import { NextResponse } from 'next/server';

import { redis } from '@/lib/redis';
import { incrementBlogViewCount } from '@/lib/supabase/blog-queries';

const blogViewRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(1, '24 h'),
  prefix: 'blog-views',
});

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

/** POST: { postId } → IP당 24시간 1회 조회수 증가 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const postId = (body as { postId?: string })?.postId;
  if (!postId) {
    return NextResponse.json({ error: 'postId가 필요합니다.' }, { status: 400 });
  }

  const ip = getClientIp(request);
  const dedupeKey = `blog-view:${postId}:${ip}`;

  try {
    const { success } = await blogViewRatelimit.limit(dedupeKey);
    if (!success) {
      return NextResponse.json({ success: true, counted: false });
    }
  } catch (error) {
    console.error('블로그 조회수 rate limit 실패:', error);
  }

  try {
    await incrementBlogViewCount(postId);
    return NextResponse.json({ success: true, counted: true });
  } catch (error) {
    console.error('블로그 조회수 증가 실패:', error);
    return NextResponse.json({ error: '조회수 증가 실패' }, { status: 500 });
  }
}

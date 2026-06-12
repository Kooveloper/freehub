import { NextResponse } from 'next/server';

import { logToolViewEvent } from '@/lib/admin/analytics';
import { redis } from '@/lib/redis';
import { incrementViewCount } from '@/lib/supabase/queries';

const VIEW_DEDUP_TTL_SECONDS = 24 * 60 * 60;

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

/** POST: { toolId } → IP당 24시간 1회 조회수 증가 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const toolId = (body as { toolId?: string })?.toolId;

  if (!toolId) {
    return NextResponse.json({ error: 'toolId가 필요합니다.' }, { status: 400 });
  }

  const ip = getClientIp(request);
  const dedupeKey = `view:${toolId}:${ip}`;

  try {
    const isNewView = await redis.set(dedupeKey, '1', {
      ex: VIEW_DEDUP_TTL_SECONDS,
      nx: true,
    });

    if (!isNewView) {
      return NextResponse.json({ success: true, counted: false });
    }
  } catch (error) {
    console.error('조회수 중복 방지 확인 실패:', error);
  }

  try {
    await incrementViewCount(toolId);
  } catch (error) {
    console.error('조회수 증가 실패:', error);
    return NextResponse.json({ error: '조회수 증가 실패' }, { status: 500 });
  }

  try {
    await logToolViewEvent(toolId);
  } catch (error) {
    console.error('조회 이벤트 기록 실패:', error);
  }

  return NextResponse.json({ success: true, counted: true });
}

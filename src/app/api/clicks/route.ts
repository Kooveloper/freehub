import { NextResponse } from 'next/server';

import { logToolClickEvent } from '@/lib/admin/analytics';

const CLICK_TYPES = new Set(['official_site', 'cta_start_free']);

/** POST: { toolId, clickType } → 외부 링크 클릭 이벤트 기록 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const toolId = (body as { toolId?: string })?.toolId;
  const clickType = (body as { clickType?: string })?.clickType;

  if (!toolId) {
    return NextResponse.json({ error: 'toolId가 필요합니다.' }, { status: 400 });
  }

  if (!clickType || !CLICK_TYPES.has(clickType)) {
    return NextResponse.json({ error: 'clickType이 올바르지 않습니다.' }, { status: 400 });
  }

  try {
    await logToolClickEvent(
      toolId,
      clickType as 'official_site' | 'cta_start_free',
    );
  } catch (error) {
    console.error('클릭 이벤트 기록 실패:', error);
    return NextResponse.json({ error: '클릭 이벤트 기록 실패' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

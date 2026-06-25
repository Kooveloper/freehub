import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** PATCH: { rating, content } — 관리자 리뷰 수정 */
export async function PATCH(request: Request, context: RouteContext) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await context.params;
  const body = await request.json();
  const rating = body?.rating !== undefined ? Number(body.rating) : undefined;
  const content =
    body?.content !== undefined ? String(body.content).trim() : undefined;

  if (rating !== undefined && (Number.isNaN(rating) || rating < 1 || rating > 5)) {
    return NextResponse.json({ error: '별점은 1~5 사이여야 합니다.' }, { status: 400 });
  }
  if (content !== undefined && content.length > 2000) {
    return NextResponse.json({ error: '리뷰는 2000자 이하로 작성해 주세요.' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (rating !== undefined) updates.rating = rating;
  if (content !== undefined) updates.content = content;

  const supabase = createServiceClient();
  const { error } = await supabase.from('tool_reviews').update(updates).eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/** DELETE — 관리자 리뷰 삭제 */
export async function DELETE(_request: Request, context: RouteContext) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await context.params;
  const supabase = createServiceClient();
  const { error } = await supabase.from('tool_reviews').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
